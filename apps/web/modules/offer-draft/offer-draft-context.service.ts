import { prisma } from "@/lib/db";
import { getBrokerDisclosureDeclarationForDeal } from "@/lib/compliance/oaciq/broker-mandatory-disclosure.service";
import { buildNegotiationAiContext, listLatestNegotiationStrategyRun } from "@/modules/deal/negotiation-strategy.service";
import { getLatestBrokerDealScore } from "@/modules/deal/deal-scoring.service";

export type OfferDraftContext = {
  deal: {
    id: string;
    listingId: string | null;
    buyerId: string;
    brokerId: string | null;
    priceCents: number;
    status: string;
    crmStage: string | null;
    executionMetadata: unknown;
    dealScore: number | null;
    closeProbability: number | null;
    riskLevel: string | null;
  };
  listing: {
    id: string;
    title: string;
    priceCad: number;
    listingType: string;
    listingCode: string;
  } | null;
  buyer: {
    id: string;
    email: string;
    homeCity: string | null;
  } | null;
  negotiationAi: Awaited<ReturnType<typeof buildNegotiationAiContext>>;
  negotiationStrategies: Awaited<ReturnType<typeof listLatestNegotiationStrategyRun>>["strategies"];
  dealScoreSnapshot: Awaited<ReturnType<typeof getLatestBrokerDealScore>>;
  brokerDisclosureLine: string | null;
  requiresConflictClause: boolean;
};

/**
 * Aggregates listing, buyer, negotiation engine inputs, scoring, and disclosure hooks for offer drafting.
 */
export async function buildOfferDraftContext(dealId: string): Promise<OfferDraftContext | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      listingId: true,
      buyerId: true,
      brokerId: true,
      priceCents: true,
      status: true,
      crmStage: true,
      executionMetadata: true,
      dealScore: true,
      closeProbability: true,
      riskLevel: true,
    },
  });
  if (!deal) return null;

  const [listing, buyer, negotiationAi, strategyRun, dealScoreSnapshot, brokerDecl] = await Promise.all([
    deal.listingId ?
      prisma.listing.findUnique({
        where: { id: deal.listingId },
        select: { id: true, title: true, price: true, listingType: true, listingCode: true },
      })
    : Promise.resolve(null),
    prisma.user.findUnique({
      where: { id: deal.buyerId },
      select: { id: true, email: true, homeCity: true },
    }),
    buildNegotiationAiContext(dealId),
    listLatestNegotiationStrategyRun(dealId),
    getLatestBrokerDealScore(dealId),
    getBrokerDisclosureDeclarationForDeal(dealId),
  ]);

  const requiresConflictClause =
    deal.status === "CONFLICT_REQUIRES_DISCLOSURE" || /conflict/i.test(deal.crmStage ?? "");

  return {
    deal: {
      id: deal.id,
      listingId: deal.listingId,
      buyerId: deal.buyerId,
      brokerId: deal.brokerId,
      priceCents: deal.priceCents,
      status: deal.status,
      crmStage: deal.crmStage,
      executionMetadata: deal.executionMetadata,
      dealScore: deal.dealScore,
      closeProbability: deal.closeProbability,
      riskLevel: deal.riskLevel,
    },
    listing: listing ?
      {
        id: listing.id,
        title: listing.title,
        priceCad: listing.price,
        listingType: String(listing.listingType),
        listingCode: listing.listingCode,
      }
    : null,
    buyer,
    negotiationAi,
    negotiationStrategies: strategyRun.strategies,
    dealScoreSnapshot,
    brokerDisclosureLine: brokerDecl,
    requiresConflictClause,
  };
}
