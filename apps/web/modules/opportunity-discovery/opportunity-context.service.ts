import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export type ListingContextRow = {
  id: string;
  listingCode: string;
  title: string;
  price: number;
  listingType: string;
  complianceScore: number | null;
  crmMarketplaceLive: boolean;
  createdAt: Date;
  esgComposite: number | null;
  esgRenovation: boolean;
  esgCoverage: number | null;
  medianPeerPrice: number;
  priceRatioToMedian: number;
};

export type DealContextRow = {
  id: string;
  dealCode: string | null;
  status: string;
  priceCents: number;
  dealScore: number | null;
  riskLevel: string | null;
  closeProbability: number | null;
  crmStage: string | null;
};

export type StrContextRow = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  nightPriceCents: number;
  completedStays: number;
  ratingAvg: number | null;
  reviewCount: number;
  aiDiscoveryScore: number | null;
  operationalRiskScore: number | null;
  pricingSuggestionsEnabled: boolean;
};

export type InvestmentContextRow = {
  id: string;
  title: string;
  pipelineStage: string;
  decisionStatus: string;
  listingId: string | null;
};

export type LeadContextRow = {
  id: string;
  name: string;
  score: number;
  conversionProbability: number | null;
  aiTier: string | null;
  pipelineStage: string;
  convoIntent: number;
  convoPriority: number;
};

export type OpportunityDiscoveryContext = {
  brokerUserId: string;
  listings: ListingContextRow[];
  deals: DealContextRow[];
  strListings: StrContextRow[];
  investments: InvestmentContextRow[];
  leads: LeadContextRow[];
  recommendationIntentByListingId: Record<string, number>;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/**
 * Aggregates broker-scoped signals for discovery engines. All metrics are heuristic / advisory.
 */
export async function buildOpportunityDiscoveryContext(brokerUserId: string): Promise<OpportunityDiscoveryContext> {
  const accesses = await prisma.brokerListingAccess.findMany({
    where: { brokerId: brokerUserId },
    take: 80,
    select: { listingId: true },
  });
  const listingIds = [...new Set(accesses.map((a) => a.listingId))];

  const listingsRaw =
    listingIds.length > 0 ?
      await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: {
          id: true,
          listingCode: true,
          title: true,
          price: true,
          listingType: true,
          complianceScore: true,
          crmMarketplaceLive: true,
          createdAt: true,
          esgProfile: {
            select: { compositeScore: true, renovation: true, dataCoveragePercent: true },
          },
        },
      })
    : [];

  const pricesByType = new Map<string, number[]>();
  for (const l of listingsRaw) {
    const k = String(l.listingType);
    const arr = pricesByType.get(k) ?? [];
    arr.push(l.price);
    pricesByType.set(k, arr);
  }

  const listings: ListingContextRow[] = listingsRaw.map((l) => {
    const peer = pricesByType.get(String(l.listingType)) ?? [l.price];
    const med = median(peer);
    const ratio = med > 0 ? l.price / med : 1;
    return {
      id: l.id,
      listingCode: l.listingCode,
      title: l.title,
      price: l.price,
      listingType: String(l.listingType),
      complianceScore: l.complianceScore,
      crmMarketplaceLive: l.crmMarketplaceLive,
      createdAt: l.createdAt,
      esgComposite: l.esgProfile?.compositeScore ?? null,
      esgRenovation: l.esgProfile?.renovation ?? false,
      esgCoverage: l.esgProfile?.dataCoveragePercent ?? null,
      medianPeerPrice: med,
      priceRatioToMedian: ratio,
    };
  });

  const dealsRaw = await prisma.deal.findMany({
    where: {
      brokerId: brokerUserId,
      NOT: { status: { in: ["closed", "cancelled"] } },
    },
    take: 60,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      dealCode: true,
      status: true,
      priceCents: true,
      crmStage: true,
      dealScores: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true, riskLevel: true } },
      closeProbabilities: { orderBy: { createdAt: "desc" }, take: 1, select: { probability: true } },
    },
  });

  const deals: DealContextRow[] = dealsRaw.map((d) => ({
    id: d.id,
    dealCode: d.dealCode,
    status: d.status,
    priceCents: d.priceCents,
    dealScore: d.dealScores[0]?.score ?? null,
    riskLevel: d.dealScores[0]?.riskLevel ?? null,
    closeProbability: d.closeProbabilities[0]?.probability ?? null,
    crmStage: d.crmStage,
  }));

  const strListingsRaw = await prisma.shortTermListing.findMany({
    where: { ownerId: brokerUserId },
    take: 40,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      bnhubListingCompletedStays: true,
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      aiDiscoveryScore: true,
      operationalRiskScore: true,
      pricingSuggestionsEnabled: true,
    },
  });

  const strListings: StrContextRow[] = strListingsRaw.map((s) => ({
    id: s.id,
    listingCode: s.listingCode,
    title: s.title,
    city: s.city,
    nightPriceCents: s.nightPriceCents,
    completedStays: s.bnhubListingCompletedStays,
    ratingAvg: s.bnhubListingRatingAverage,
    reviewCount: s.bnhubListingReviewCount,
    aiDiscoveryScore: s.aiDiscoveryScore,
    operationalRiskScore: s.operationalRiskScore,
    pricingSuggestionsEnabled: s.pricingSuggestionsEnabled,
  }));

  const investmentsRaw = await prisma.lecipmPipelineDeal.findMany({
    where: { brokerId: brokerUserId },
    take: 40,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, pipelineStage: true, decisionStatus: true, listingId: true },
  });

  const investments: InvestmentContextRow[] = investmentsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    pipelineStage: p.pipelineStage,
    decisionStatus: p.decisionStatus,
    listingId: p.listingId,
  }));

  const leadsRaw = await prisma.lead.findMany({
    where: { introducedByBrokerId: brokerUserId },
    take: 50,
    orderBy: { score: "desc" },
    select: {
      id: true,
      name: true,
      score: true,
      conversionProbability: true,
      aiTier: true,
      pipelineStage: true,
      crmConversation: { select: { intentScore: true, priorityScore: true } },
    },
  });

  const leads: LeadContextRow[] = leadsRaw.map((l) => ({
    id: l.id,
    name: l.name,
    score: l.score,
    conversionProbability: l.conversionProbability,
    aiTier: l.aiTier,
    pipelineStage: l.pipelineStage,
    convoIntent: l.crmConversation?.intentScore ?? 0,
    convoPriority: l.crmConversation?.priorityScore ?? 0,
  }));

  const recs = await prisma.aiRecommendationHistory.findMany({
    where: { userId: brokerUserId, listingId: { not: null } },
    orderBy: { presentedAt: "desc" },
    take: 40,
    select: { listingId: true, rankScore: true },
  });
  const recommendationIntentByListingId: Record<string, number> = {};
  for (const r of recs) {
    if (!r.listingId) continue;
    const prev = recommendationIntentByListingId[r.listingId] ?? 0;
    recommendationIntentByListingId[r.listingId] = Math.max(prev, r.rankScore ?? 0.5);
  }

  return {
    brokerUserId,
    listings,
    deals,
    strListings,
    investments,
    leads,
    recommendationIntentByListingId,
  };
}
