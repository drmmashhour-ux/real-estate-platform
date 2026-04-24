import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { BrokerAssistantContext, BrokerAssistantDocumentType, BrokerAssistantLanguagePreference } from "@/modules/broker-assistant/broker-assistant.types";

export type BuildContextInput = Partial<BrokerAssistantContext> & {
  documentType?: BrokerAssistantDocumentType;
  languagePreference?: BrokerAssistantLanguagePreference;
};

/**
 * Normalizes caller-supplied fields into a full `BrokerAssistantContext`.
 * For DB-backed enrichment, call `enrichBrokerAssistantContextFromDeal` separately.
 */
export function buildBrokerAssistantContext(input: BuildContextInput): BrokerAssistantContext {
  const caseId = input.caseId ?? randomUUID();
  return {
    caseId,
    dealId: input.dealId,
    listingId: input.listingId,
    documentType: input.documentType ?? "other",
    transactionMode: input.transactionMode ?? "unknown",
    offerStatus: input.offerStatus ?? "unknown",
    languagePreference: input.languagePreference ?? "BILINGUAL",
    listing: input.listing,
    parties: input.parties ?? [],
    broker: input.broker,
    conditions: input.conditions,
    dates: input.dates,
    inclusionsExclusions: input.inclusionsExclusions,
    disclosures: input.disclosures,
    conflict: input.conflict,
    fsboContext: input.fsboContext,
    currentDraftText: input.currentDraftText,
    isPublicOrClientFacing: input.isPublicOrClientFacing,
    metadata: input.metadata,
  };
}

/**
 * Enriches context from `LecipmPipelineDeal` + linked listing (broker must have access — enforce at route).
 */
export async function enrichBrokerAssistantContextFromPipelineDeal(
  dealId: string,
  base: BuildContextInput = {},
): Promise<BrokerAssistantContext | null> {
  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      title: true,
      dealType: true,
      listingId: true,
      brokerId: true,
      listing: {
        select: {
          title: true,
          listingType: true,
        },
      },
    },
  });
  if (!deal) return null;

  const merged = buildBrokerAssistantContext({
    ...base,
    caseId: base.caseId ?? deal.id,
    dealId: deal.id,
    listingId: deal.listingId ?? base.listingId,
    metadata: { ...base.metadata, pipelineDealType: deal.dealType },
    listing: {
      ...base.listing,
      listingTypeHint: deal.listing?.listingType ?? base.listing?.listingTypeHint,
    },
    broker: {
      ...base.broker,
    },
    parties: base.parties?.length ? base.parties : [],
  });

  return merged;
}

function mapCrmDealStatus(status: string): BrokerAssistantContext["offerStatus"] {
  const s = status.toLowerCase();
  if (s.includes("submitted") || s === "offer_submitted") return "submitted";
  if (s === "accepted") return "accepted";
  if (s === "declined" || s === "cancelled") return "declined";
  if (s.includes("counter")) return "countered";
  return "draft";
}

/**
 * Enriches context from CRM `Deal` (buyer/seller/broker + optional listing) — access enforced by OR on parties.
 */
export async function enrichBrokerAssistantContextFromCrmDeal(
  dealId: string,
  actorUserId: string,
  base: BuildContextInput = {},
): Promise<BrokerAssistantContext | null> {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ brokerId: actorUserId }, { buyerId: actorUserId }, { sellerId: actorUserId }],
    },
    select: {
      id: true,
      listingId: true,
      status: true,
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      broker: {
        select: {
          name: true,
          lecipmBrokerLicenceProfile: { select: { verifiedAt: true, licenceNumber: true } },
        },
      },
    },
  });
  if (!deal) return null;

  const listingRow = deal.listingId
    ? await prisma.listing.findUnique({
        where: { id: deal.listingId },
        select: { title: true, titleFr: true, listingType: true },
      })
    : null;

  const addrLine = listingRow?.titleFr?.trim() || listingRow?.title?.trim();

  return buildBrokerAssistantContext({
    ...base,
    caseId: base.caseId ?? deal.id,
    dealId: deal.id,
    listingId: deal.listingId ?? base.listingId,
    offerStatus: base.offerStatus ?? mapCrmDealStatus(deal.status),
    transactionMode: base.transactionMode ?? "represented_purchase",
    parties: base.parties?.length
      ? base.parties
      : [
          { role: "buyer", fullName: deal.buyer.name ?? undefined, email: deal.buyer.email },
          { role: "seller", fullName: deal.seller.name ?? undefined, email: deal.seller.email },
        ],
    broker: deal.broker
      ? {
          ...base.broker,
          displayName: deal.broker.name ?? base.broker?.displayName,
          licenceNumberHint: deal.broker.lecipmBrokerLicenceProfile?.licenceNumber ?? undefined,
          brokerDisclosureRecorded: Boolean(deal.broker.lecipmBrokerLicenceProfile?.verifiedAt),
        }
      : base.broker,
    listing: {
      ...base.listing,
      addressLine: base.listing?.addressLine ?? addrLine,
      listingTypeHint: listingRow?.listingType ?? base.listing?.listingTypeHint,
    },
    metadata: { ...base.metadata, crmDealId: deal.id, crmDealStatus: deal.status },
  });
}

/**
 * Resolves `BrokerAssistantContext` from API JSON: optional `crmDealId` / `pipelineDealId` enrichment.
 */
export async function resolveBrokerAssistantContextFromRequestBody(
  body: Record<string, unknown>,
  actorUserId: string,
): Promise<BrokerAssistantContext> {
  const crmDealId = typeof body.crmDealId === "string" ? body.crmDealId : "";
  const pipelineDealId = typeof body.pipelineDealId === "string" ? body.pipelineDealId : "";
  const partial = body as Partial<BrokerAssistantContext>;

  if (crmDealId) {
    return (
      (await enrichBrokerAssistantContextFromCrmDeal(crmDealId, actorUserId, partial)) ??
      buildBrokerAssistantContext(partial)
    );
  }
  if (pipelineDealId) {
    return (
      (await enrichBrokerAssistantContextFromPipelineDeal(pipelineDealId, partial)) ??
      buildBrokerAssistantContext(partial)
    );
  }
  return buildBrokerAssistantContext(partial);
}
