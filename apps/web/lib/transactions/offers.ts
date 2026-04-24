import { prisma } from "@/lib/db";
import { assertCoownershipEnforcementAllows } from "@/services/compliance/coownershipCompliance.service";
import { assertAutopilotOutboundAllowed } from "@/lib/signature-control/autopilot-guard";
import { assertBrokerApprovedOfferSubmission } from "@/lib/compliance/oaciq/broker-decision-authority";
import {
  assertOaciqClientDisclosureAck,
  getOaciqDisclosureBundleForTransaction,
  mergePropertyOfferConditionsWithOaciq,
  oaciqClientDisclosureEnforcementEnabled,
} from "@/lib/compliance/oaciq/client-disclosure";
import { recordTransactionEvent } from "./events";
import type { OfferStatus, TransactionStatus } from "./constants";
import { BrokerActionGuard } from "@/lib/compliance/broker-action-guard";
import {
  assertMandatoryBrokerDisclosureForOfferPath,
  MandatoryBrokerDisclosureError,
} from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";
import { assertBrokerProfessionalInsuranceActiveOrThrow } from "@/lib/compliance/oaciq/broker-professional-insurance.service";

export interface SubmitOfferInput {
  transactionId: string;
  buyerId: string;
  offerPrice: number; // cents
  conditions?: unknown;
  expirationDate?: Date | null;
  /** Required when `LECIPM_AUTOPILOT_SIGNATURE_GATE` is enabled — broker-signed action pipeline. */
  actionPipelineId?: string | null;
}

export async function submitOffer(input: SubmitOfferInput): Promise<{ offerId: string; status: OfferStatus }> {
  await assertAutopilotOutboundAllowed({
    operation: "submit_offer",
    actionPipelineId: input.actionPipelineId,
  });

  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: input.transactionId },
    select: { id: true, buyerId: true, brokerId: true, listingId: true, status: true },
  });
  if (!tx) throw new Error("Transaction not found");
  if (tx.buyerId !== input.buyerId) throw new Error("Only the buyer can submit offers");
  if (["completed", "cancelled"].includes(tx.status)) throw new Error("Transaction is no longer active");

  if (tx.brokerId) {
    await assertBrokerApprovedOfferSubmission({
      responsibleBrokerId: tx.brokerId,
      realEstateTransactionId: input.transactionId,
      listingId: tx.listingId ?? null,
    });
  }

  if (tx.listingId) {
    try {
      await assertMandatoryBrokerDisclosureForOfferPath({
        brokerId: tx.brokerId,
        listingId: tx.listingId,
      });
    } catch (e) {
      if (e instanceof MandatoryBrokerDisclosureError) throw e;
      throw e;
    }
  }

  if (tx.brokerId) {
    await assertBrokerProfessionalInsuranceActiveOrThrow(tx.brokerId, "transaction_offer_submit");
  }

  if (oaciqClientDisclosureEnforcementEnabled()) {
    await assertOaciqClientDisclosureAck({
      transactionId: input.transactionId,
      userId: input.buyerId,
      flow: "OFFER_SUBMIT",
    });
  }

  const oaciqBundle = await getOaciqDisclosureBundleForTransaction(input.transactionId);
  const conditionsPayload = mergePropertyOfferConditionsWithOaciq(input.conditions ?? null, oaciqBundle);

  const offer = await prisma.propertyOffer.create({
    data: {
      transactionId: input.transactionId,
      buyerId: input.buyerId,
      offerPrice: input.offerPrice,
      conditions: conditionsPayload as object,
      expirationDate: input.expirationDate ?? undefined,
      status: "pending",
    },
  });

  await prisma.realEstateTransaction.update({
    where: { id: input.transactionId },
    data: { offerPrice: input.offerPrice, status: "offer_submitted" },
  });
  await recordTransactionEvent(input.transactionId, "offer_submitted", { offerId: offer.id, offerPrice: input.offerPrice }, input.buyerId);

  return { offerId: offer.id, status: offer.status as OfferStatus };
}

export interface CounterOfferInput {
  offerId: string;
  counterPrice: number; // cents
  notes?: string | null;
  createdById: string; // seller or broker
}

export async function counterOffer(input: CounterOfferInput): Promise<{ counterOfferId: string }> {
  const offer = await prisma.propertyOffer.findUnique({
    where: { id: input.offerId },
    include: { transaction: { select: { sellerId: true, brokerId: true, status: true } } },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "pending") throw new Error("Offer is not pending");
  const isSellerOrBroker =
    offer.transaction.sellerId === input.createdById || offer.transaction.brokerId === input.createdById;
  if (!isSellerOrBroker) throw new Error("Only seller or broker can counter");

  // PHASE 2 & 4: BROKERAGE ACTION GUARD
  if (offer.transaction.brokerId === input.createdById) {
    const guard = await BrokerActionGuard.validateBrokerageAction({
      userId: input.createdById,
      action: "NEGOTIATE",
      entityId: offer.transactionId,
      entityType: "Deal" as any,
    });
    if (!guard.allowed) throw new Error(guard.reason || "Unauthorized brokerage action.");
    await assertBrokerProfessionalInsuranceActiveOrThrow(input.createdById, "transaction_offer_counter");
  }

  if (["completed", "cancelled"].includes(offer.transaction.status)) throw new Error("Transaction is no longer active");

  const counter = await prisma.propertyCounterOffer.create({
    data: {
      offerId: input.offerId,
      counterPrice: input.counterPrice,
      notes: input.notes ?? undefined,
      createdById: input.createdById,
    },
  });

  await prisma.propertyOffer.update({
    where: { id: input.offerId },
    data: { status: "countered" },
  });
  await prisma.realEstateTransaction.update({
    where: { id: offer.transactionId },
    data: { offerPrice: input.counterPrice, status: "negotiation" },
  });
  await recordTransactionEvent(offer.transactionId, "offer_countered", {
    offerId: input.offerId,
    counterOfferId: counter.id,
    counterPrice: input.counterPrice,
  }, input.createdById);

  // PHASE 6: AUDIT LOG (If counter by broker)
  if (offer.transaction.brokerId === input.createdById) {
    const { BrokerageAuditService } = await import("@/lib/compliance/brokerage-audit.service");
    void BrokerageAuditService.logAction({
      brokerId: input.createdById,
      action: "counter_offer",
      dealId: offer.transactionId,
      metadata: { offerId: input.offerId, counterPrice: input.counterPrice },
    });
  }

  return { counterOfferId: counter.id };
}

export interface AcceptOfferInput {
  offerId: string;
  acceptedById: string; // buyer accepts offer (or seller accepts buyer's offer when no counter)
  acceptCounterOfferId?: string | null; // if set, buyer accepts this counter
}

export async function acceptOffer(input: AcceptOfferInput): Promise<{ transactionId: string; status: TransactionStatus }> {
  const offer = await prisma.propertyOffer.findUnique({
    where: { id: input.offerId },
    include: {
      transaction: true,
      counterOffers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!offer) throw new Error("Offer not found");
  if (!["pending", "countered"].includes(offer.status)) throw new Error("Offer cannot be accepted");

  if (offer.transaction.brokerId === input.acceptedById) {
    await assertBrokerProfessionalInsuranceActiveOrThrow(input.acceptedById, "transaction_offer_accept");
  }

  const isBuyer = offer.transaction.buyerId === input.acceptedById;
  const isSeller = offer.transaction.sellerId === input.acceptedById;

  // PHASE 2 & 4: BROKERAGE ACTION GUARD
  if (offer.transaction.brokerId === input.acceptedById && !isBuyer && !isSeller) {
    const guard = await BrokerActionGuard.validateBrokerageAction({
      userId: input.acceptedById,
      action: "ACCEPT_OFFER",
      entityId: offer.transactionId,
      entityType: "Deal" as any,
    });
    if (!guard.allowed) throw new Error(guard.reason || "Unauthorized brokerage action.");
  }

  let finalPrice = offer.offerPrice;
  if (offer.status === "countered") {
    if (!isBuyer) throw new Error("Only buyer can accept a counter offer");
    const counterId = input.acceptCounterOfferId ?? offer.counterOffers[0]?.id;
    if (!counterId) throw new Error("No counter offer to accept");
    const counter = offer.counterOffers.find((c) => c.id === counterId) ?? offer.counterOffers[0];
    if (counter) finalPrice = counter.counterPrice;
  } else {
    if (!isSeller && offer.transaction.brokerId !== input.acceptedById) throw new Error("Only seller or broker can accept the initial offer");
  }

  const crmListingId = offer.transaction.listingId;
  if (crmListingId) {
    await assertCoownershipEnforcementAllows(crmListingId, "accept_offer");
  }

  await prisma.propertyOffer.update({
    where: { id: input.offerId },
    data: { status: "accepted" },
  });
  await prisma.realEstateTransaction.update({
    where: { id: offer.transactionId },
    data: { offerPrice: finalPrice, status: "deposit_required" },
  });

  await recordTransactionEvent(offer.transactionId, "offer_accepted", {
    offerId: input.offerId,
    acceptedBy: input.acceptedById,
    finalPrice,
  }, input.acceptedById);

  // PHASE 6: AUDIT LOG (If accepted by broker)
  if (offer.transaction.brokerId === input.acceptedById) {
    const { BrokerageAuditService } = await import("@/lib/compliance/brokerage-audit.service");
    void BrokerageAuditService.logAction({
      brokerId: input.acceptedById,
      action: "accept_offer",
      dealId: offer.transactionId,
      metadata: { offerId: input.offerId, finalPrice },
    });
  }

  return { transactionId: offer.transactionId, status: "deposit_required" };
}

export async function rejectOffer(offerId: string, rejectedById: string): Promise<void> {
  const offer = await prisma.propertyOffer.findUnique({
    where: { id: offerId },
    include: { transaction: { select: { sellerId: true, brokerId: true } } },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.status !== "pending" && offer.status !== "countered") throw new Error("Offer cannot be rejected");
  const allowed = offer.transaction.sellerId === rejectedById || offer.transaction.brokerId === rejectedById || offer.buyerId === rejectedById;
  if (!allowed) throw new Error("Not authorized to reject this offer");

  await prisma.propertyOffer.update({
    where: { id: offerId },
    data: { status: "rejected" },
  });
  await recordTransactionEvent(offer.transactionId, "offer_rejected", { offerId, rejectedBy: rejectedById }, rejectedById);
}
