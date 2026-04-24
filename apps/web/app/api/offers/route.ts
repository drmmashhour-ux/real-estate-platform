import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { assertListingExists } from "@/modules/offers/services/listing-exists";
import {
  OFFER_MAX_CONDITIONS,
  OFFER_MAX_MESSAGE,
  parseOptionalClosingDate,
  parseOptionalString,
  parseOfferedPrice,
  parseScenario,
} from "@/modules/offers/services/offer-validation";
import { recordAnalyticsFunnelEvent } from "@/lib/funnel/analytics-events";
import { notifyOfferEvent } from "@/modules/offers/services/offer-notifications";
import { assertBuyerOfferAllowed } from "@/modules/legal/assert-legal";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { maybeBlockOfferForDeclaration } from "@/modules/offers/services/offer-declaration-gate";
import { assertComplianceReviewApprovedIfRequired } from "@/lib/contracts/compliance-review-service";
import { enforceComplianceAction } from "@/lib/compliance/enforce-compliance-action";
import {
  assertOaciqClientDisclosureAck,
  findRealEstateTransactionIdForListingOffer,
  formatOaciqDisclosurePlainText,
  getOaciqDisclosureBundleForTransaction,
  oaciqClientDisclosureEnforcementEnabled,
} from "@/lib/compliance/oaciq/client-disclosure";
import {
  assertBrokerApprovedOfferSubmission,
  assertLegallyBindingCallerNotAutomated,
  brokerDecisionAuthorityEnforced,
  resolveResponsibleBrokerIdForCrmListing,
} from "@/lib/compliance/oaciq/broker-decision-authority";

const DEMO_OFFER_LISTING_IDS = new Set(["1", "test-listing-1", "demo-listing-montreal"]);

async function resolveOfferComplianceOwner(listingId: string): Promise<{ ownerType: string; ownerId: string }> {
  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { tenantId: true, ownerId: true },
  });
  if (crm) {
    if (crm.tenantId) return { ownerType: "agency", ownerId: crm.tenantId };
    if (crm.ownerId) return { ownerType: "solo_broker", ownerId: crm.ownerId };
    return { ownerType: "platform", ownerId: "platform" };
  }
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { tenantId: true, ownerId: true },
  });
  if (fsbo) {
    if (fsbo.tenantId) return { ownerType: "agency", ownerId: fsbo.tenantId };
    return { ownerType: "solo_broker", ownerId: fsbo.ownerId };
  }
  return { ownerType: "platform", ownerId: "platform" };
}

export const dynamic = "force-dynamic";

/**
 * POST /api/offers — submit a new offer (status SUBMITTED).
 * Does not accept brokerId from client (set later or via admin).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const listingCheck = await assertListingExists(listingId);
  if (!listingCheck.ok) {
    return NextResponse.json({ error: listingCheck.error }, { status: listingCheck.status });
  }

  const declBlock = await maybeBlockOfferForDeclaration(listingId);
  if (declBlock) return declBlock;

  const phase3Gate = await maybeBlockRequestWithLegalGate({
    action: "submit_offer",
    userId,
    actorType: "buyer",
  });
  if (phase3Gate) return phase3Gate;

  if (!legalEnforcementDisabled()) {
    const legal = await assertBuyerOfferAllowed(userId, listingId);
    if (!legal.ok) {
      return NextResponse.json(
        {
          error: legal.blockingReasons[0] ?? "Complete required legal acknowledgments before submitting an offer.",
          code: "LEGAL_FORMS_REQUIRED",
          missing: legal.missing.map((m) => m.key),
        },
        { status: 403 }
      );
    }
  }

  if (enforceableContractsRequired()) {
    const signed = await hasActiveEnforceableContract(userId, ENFORCEABLE_CONTRACT_TYPES.BUYER, { listingId });
    if (!signed) {
      return NextResponse.json(
        {
          error:
            "Sign the buyer agreement for this listing before submitting an offer (legal → ContractSign with kind=buyer and listing id).",
          code: "ENFORCEABLE_CONTRACT_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  if (!DEMO_OFFER_LISTING_IDS.has(listingId)) {
    const adminReview = await assertComplianceReviewApprovedIfRequired(listingId);
    const listingCompliant = adminReview.ok;
    const scope = await resolveOfferComplianceOwner(listingId);
    const guard = await enforceComplianceAction({
      ownerType: scope.ownerType,
      ownerId: scope.ownerId,
      moduleKey: "offers",
      actionKey: "submit_offer",
      entityType: "listing",
      entityId: listingId,
      actorType: "buyer",
      actorId: userId,
      facts: {
        listingCompliant,
        depositRequired: false,
        trustDepositReady: true,
      },
    });
    if (!guard.allowed) {
      return NextResponse.json(
        {
          error: guard.reasonCode ?? "OFFER_SUBMISSION_BLOCKED",
          message: guard.message,
          decisionId: guard.decisionId,
        },
        { status: 403 },
      );
    }
  }

  const price = parseOfferedPrice(body.offeredPrice);
  if (!price.ok) return NextResponse.json({ error: price.error }, { status: 400 });

  let down: number | null | undefined;
  if (body.downPaymentAmount != null && body.downPaymentAmount !== "") {
    const d = typeof body.downPaymentAmount === "number" ? body.downPaymentAmount : parseFloat(String(body.downPaymentAmount));
    if (!Number.isFinite(d) || d < 0) return NextResponse.json({ error: "downPaymentAmount is invalid" }, { status: 400 });
    down = d;
  }

  let financing: boolean | null | undefined;
  if (body.financingNeeded === true || body.financingNeeded === false) financing = body.financingNeeded;
  if (body.financingNeeded === "yes") financing = true;
  if (body.financingNeeded === "no") financing = false;

  const closing = await parseOptionalClosingDate(body.closingDate);
  if (!closing.ok) return NextResponse.json({ error: closing.error }, { status: 400 });

  const cond = parseOptionalString(body.conditions, OFFER_MAX_CONDITIONS, "conditions");
  if (!cond.ok) return NextResponse.json({ error: cond.error }, { status: 400 });
  const msg = parseOptionalString(body.message, OFFER_MAX_MESSAGE, "message");
  if (!msg.ok) return NextResponse.json({ error: msg.error }, { status: 400 });

  const scenario = parseScenario(body.scenario);

  const linkedTxId = await findRealEstateTransactionIdForListingOffer({
    listingId,
    buyerId: userId,
  });

  if (brokerDecisionAuthorityEnforced()) {
    try {
      assertLegallyBindingCallerNotAutomated(body);
      if (linkedTxId) {
        const txRow = await prisma.realEstateTransaction.findUnique({
          where: { id: linkedTxId },
          select: { brokerId: true },
        });
        if (txRow?.brokerId) {
          await assertBrokerApprovedOfferSubmission({
            responsibleBrokerId: txRow.brokerId,
            realEstateTransactionId: linkedTxId,
            listingId,
          });
        }
      } else {
        const brokerId = await resolveResponsibleBrokerIdForCrmListing(listingId);
        if (brokerId) {
          await assertBrokerApprovedOfferSubmission({
            responsibleBrokerId: brokerId,
            listingId,
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Broker approval required";
      return NextResponse.json(
        { error: msg, code: "BROKER_DECISION_AUTHORITY_REQUIRED" },
        { status: 403 }
      );
    }
  }

  if (linkedTxId && oaciqClientDisclosureEnforcementEnabled()) {
    try {
      await assertOaciqClientDisclosureAck({
        transactionId: linkedTxId,
        userId,
        flow: "OFFER_SUBMIT",
      });
    } catch (e) {
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : "OACIQ disclosure required",
          code: "OACIQ_CLIENT_DISCLOSURE_REQUIRED",
        },
        { status: 403 }
      );
    }
  }
  let conditionsOut = cond.value;
  if (linkedTxId) {
    const bundle = await getOaciqDisclosureBundleForTransaction(linkedTxId);
    const appendix = formatOaciqDisclosurePlainText(bundle);
    conditionsOut = conditionsOut ? `${conditionsOut}\n\n${appendix}` : appendix;
  }

  const data: Prisma.OfferCreateInput = {
    listingId,
    buyer: { connect: { id: userId } },
    status: "SUBMITTED",
    offeredPrice: price.value,
    downPaymentAmount: down ?? null,
    financingNeeded: financing ?? null,
    closingDate: closing.value,
    conditions: conditionsOut,
    message: msg.value,
    ...(scenario !== undefined ? { scenario } : {}),
  };

  const offer = await prisma.$transaction(async (tx) => {
    const o = await tx.offer.create({ data });
    await tx.offerEvent.create({
      data: {
        offerId: o.id,
        actorId: userId,
        type: "CREATED",
        message: "Offer created",
        metadata: { submitted: true },
      },
    });
    await tx.offerEvent.create({
      data: {
        offerId: o.id,
        actorId: userId,
        type: "SUBMITTED",
        message: msg.value ?? "Offer submitted",
      },
    });
    return o;
  });

  void trackDemoEvent(
    DemoEvents.OFFER_SUBMITTED,
    { listingId: offer.listingId, offeredPrice: offer.offeredPrice },
    userId
  );
  void recordAnalyticsFunnelEvent({
    name: "deal_started",
    listingId: offer.listingId,
    userId,
    source: "offer_submitted",
    metadata: { offerId: offer.id },
  });
  notifyOfferEvent("offer_submitted", {
    offerId: offer.id,
    listingId: offer.listingId,
    buyerId: userId,
  });

  return NextResponse.json({ ok: true, offer });
}
