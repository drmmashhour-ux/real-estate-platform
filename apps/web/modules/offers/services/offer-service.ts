import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES, LEASE_CONTRACT_STATUS } from "@/lib/hubs/contract-types";
import { buildPurchaseOfferHtml } from "@/modules/contracts/services/templates/purchase-offer-template";
import { buildRentalOfferHtml } from "@/modules/contracts/services/templates/rental-offer-template";
import { sendContractSignRequestEmail } from "@/lib/email/contract-emails";
import { recordDealLegalAction } from "@/lib/deals/legal-timeline";
import { getPublicAppUrl } from "@/lib/config/public-app-url";

export type OfferTypeKey = "purchase_offer" | "rental_offer";

export type CreateOfferInput = {
  actorId: string;
  actorRole: string;
  type: OfferTypeKey;
  listingId?: string | null;
  leadId?: string | null;
  body: Record<string, unknown>;
};

export async function createOfferDocument(input: CreateOfferInput): Promise<{
  offerDocumentId: string;
  contractId: string;
  offerUrl: string;
}> {
  const actor = await prisma.user.findUnique({ where: { id: input.actorId }, select: { id: true, role: true, name: true, email: true } });
  if (!actor) throw new Error("User not found");
  if (actor.role === "VISITOR") throw new Error("Not authorized to create offers");

  const r = `LEC-OFF-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const b = input.body;

  let listing: { id: string; title: string; address: string; city: string | null; region: string | null } | null = null;
  if (input.listingId) {
    listing = await prisma.shortTermListing.findUnique({
      where: { id: input.listingId },
      select: { id: true, title: true, address: true, city: true, region: true },
    });
    if (!listing) throw new Error("Listing not found");
  }

  const propertyAddress = listing?.address ? `${listing.address}, ${listing.city ?? ""}` : String(b.propertyAddress ?? "");
  const listingTitle = listing?.title ?? String(b.listingTitle ?? "Property");

  let contentHtml = "";
  let contractType: string = CONTRACT_TYPES.OFFER_PURCHASE;
  let title = "Offer";
  let offerPriceCents: number | null = null;

  if (input.type === "purchase_offer") {
    contractType = CONTRACT_TYPES.OFFER_PURCHASE;
    title = "Purchase offer";
    offerPriceCents = Math.round(Number(b.offerPriceCents ?? 0));
    contentHtml = buildPurchaseOfferHtml({
      ref: r,
      buyerName: String(b.buyerName ?? actor.name ?? "Buyer"),
      buyerEmail: String(b.buyerEmail ?? actor.email),
      sellerName: b.sellerName ? String(b.sellerName) : undefined,
      propertyAddress,
      listingTitle,
      offerPriceCents,
      depositCents: Math.round(Number(b.depositCents ?? 0)),
      financingCondition: String(b.financingCondition ?? "Subject to financing approval"),
      inspectionCondition: String(b.inspectionCondition ?? "Subject to inspection"),
      occupancyDate: String(b.occupancyDate ?? "—"),
      irrevocableUntil: String(b.irrevocableUntil ?? "—"),
      extraConditions: String(b.extraConditions ?? ""),
      generatedAt: now,
    });
  } else {
    contractType = CONTRACT_TYPES.OFFER_RENTAL;
    title = "Rental offer";
    offerPriceCents = Math.round(Number(b.monthlyRentCents ?? b.offerPriceCents ?? 0));
    contentHtml = buildRentalOfferHtml({
      ref: r,
      tenantName: String(b.tenantName ?? actor.name ?? "Tenant"),
      tenantEmail: String(b.tenantEmail ?? actor.email),
      propertyAddress,
      listingTitle,
      monthlyRentCents: offerPriceCents,
      leaseStart: String(b.leaseStart ?? ""),
      leaseEnd: String(b.leaseEnd ?? ""),
      depositCents: Math.round(Number(b.depositCents ?? 0)),
      conditions: String(b.conditions ?? ""),
      generatedAt: now,
    });
  }

  const conditionsJson: Prisma.InputJsonValue = (b.conditionsJson as Prisma.InputJsonValue) ?? {
    financing: b.financingCondition,
    inspection: b.inspectionCondition,
    extra: b.extraConditions,
  };

  const buyerEmail = String(b.buyerEmail ?? b.tenantEmail ?? actor.email);
  const sellerEmail = String(b.sellerEmail ?? b.landlordEmail ?? "");

  const result = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        type: contractType,
        userId: actor.id,
        createdById: actor.id,
        listingId: listing?.id ?? (typeof b.listingId === "string" ? b.listingId : null),
        title,
        contentHtml,
        content: { kind: "offer_v1", ref: r, offerType: input.type } as unknown as Prisma.InputJsonValue,
        status: LEASE_CONTRACT_STATUS.SENT,
        hub: "broker",
      },
    });

    const sigs: { name: string; email: string; role: string; userId: string | null }[] = [
      {
        name: String(b.buyerName ?? b.tenantName ?? actor.name ?? "Buyer"),
        email: buyerEmail,
        role: input.type === "purchase_offer" ? "buyer" : "tenant",
        userId: actor.id,
      },
    ];
    if (sellerEmail) {
      sigs.push({
        name: String(b.sellerName ?? b.landlordName ?? "Seller"),
        email: sellerEmail,
        role: input.type === "purchase_offer" ? "seller" : "landlord",
        userId: null,
      });
    }

    await tx.contractSignature.createMany({
      data: sigs.map((s) => ({
        contractId: c.id,
        name: s.name,
        email: s.email,
        role: s.role,
        userId: s.userId,
      })),
    });

    const od = await tx.offerDocument.create({
      data: {
        type: input.type,
        listingId: listing?.id ?? (typeof b.listingId === "string" ? b.listingId : null),
        leadId: typeof input.leadId === "string" ? input.leadId : typeof b.leadId === "string" ? b.leadId : null,
        contractId: c.id,
        createdById: actor.id,
        status: "sent",
        offerPriceCents,
        conditionsJson,
        contentHtml,
      },
    });

    return { contract: c, offer: od };
  });

  const appUrl = getPublicAppUrl();
  const offerUrl = `${appUrl}/contracts/${result.contract.id}`;

  await sendContractSignRequestEmail({
    to: [buyerEmail, sellerEmail].filter(Boolean),
    signUrl: offerUrl,
    title,
    reference: r,
  });

  const effectiveLeadId =
    typeof input.leadId === "string"
      ? input.leadId
      : typeof b.leadId === "string"
        ? b.leadId
        : null;
  if (effectiveLeadId) {
    const linkedDeal = await prisma.deal.findFirst({
      where: { leadId: effectiveLeadId },
      select: { id: true },
    });
    if (linkedDeal && input.type === "purchase_offer") {
      await recordDealLegalAction({
        dealId: linkedDeal.id,
        actorUserId: input.actorId,
        action: "PROMISE_RECEIVED",
        note: "Purchase offer document generated and attached automatically.",
        documentIds: [result.offer.id],
      }).catch(() => {});
    }
  }

  return {
    offerDocumentId: result.offer.id,
    contractId: result.contract.id,
    offerUrl,
  };
}
