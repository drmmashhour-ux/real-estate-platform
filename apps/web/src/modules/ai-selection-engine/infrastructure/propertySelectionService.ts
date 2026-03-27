import { prisma } from "@/lib/db";
import { aggregateListingIntelligence } from "@/src/core/intelligence/aggregation/aggregationEngine";
import { PropertySelectionCategory } from "@/src/modules/ai-selection-engine/domain/selection.enums";
import type { PropertySelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";
import { sortByScoreDesc, weightedScore } from "@/src/modules/ai-selection-engine/infrastructure/selectionRankingService";

type PropertyCandidate = {
  id: string;
  city: string;
  title: string;
  priceCents: number;
  trustScore: number | null;
  riskScore: number;
  listingDealType: string;
  dealScore: number;
  confidence: number;
  roi: number;
  personalization: number;
};

function mapRow(base: PropertyCandidate, category: PropertySelectionCategory, score: number, reasons: string[], action: string): PropertySelectionResult {
  return {
    id: `${category}:${base.id}`,
    type: "property",
    category,
    listingId: base.id,
    city: base.city,
    priceCents: base.priceCents,
    trustScore: base.trustScore,
    dealScore: base.dealScore,
    score,
    confidence: base.confidence,
    reasons,
    recommendedAction: action,
  };
}

export function selectPropertyCategoryWinners(rows: PropertyCandidate[]) {
  const bestDeal = sortByScoreDesc(
    rows.map((r) => ({
      r,
      score: weightedScore([
        { value: r.dealScore, weight: 0.5 },
        { value: r.confidence, weight: 0.2 },
        { value: 100 - r.riskScore, weight: 0.2 },
        { value: r.personalization, weight: 0.1 },
      ]),
    }))
  )[0];

  const safest = sortByScoreDesc(
    rows.map((r) => ({
      r,
      score: weightedScore([
        { value: r.trustScore ?? 45, weight: 0.45 },
        { value: 100 - r.riskScore, weight: 0.35 },
        { value: r.confidence, weight: 0.2 },
      ]),
    }))
  )[0];

  const cashflow = sortByScoreDesc(
    rows.map((r) => ({
      r,
      score: weightedScore([
        { value: Math.max(0, Math.min(100, Math.round(r.roi * 10))), weight: 0.5 },
        { value: r.dealScore, weight: 0.3 },
        { value: r.confidence, weight: 0.2 },
      ]),
    }))
  )[0];

  const longTerm = sortByScoreDesc(
    rows.map((r) => ({
      r,
      score: weightedScore([
        { value: r.dealScore, weight: 0.4 },
        { value: r.trustScore ?? 45, weight: 0.2 },
        { value: r.personalization, weight: 0.2 },
        { value: r.confidence, weight: 0.2 },
      ]),
    }))
  )[0];

  const bnhub = sortByScoreDesc(
    rows.map((r) => ({
      r,
      score: weightedScore([
        { value: r.listingDealType === "RENT_SHORT" ? 95 : 35, weight: 0.5 },
        { value: r.dealScore, weight: 0.25 },
        { value: r.trustScore ?? 45, weight: 0.15 },
        { value: r.confidence, weight: 0.1 },
      ]),
    }))
  )[0];

  return { bestDeal, safest, cashflow, longTerm, bnhub };
}

export async function rankPropertiesForUser(userId: string): Promise<PropertySelectionResult[]> {
  const prefs = await prisma.userFeedPreference.findUnique({ where: { userId } });
  const preferredCities = ((prefs?.preferredCities as string[] | null) ?? []).map((x) => x.toLowerCase());

  const listings = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      city: true,
      title: true,
      priceCents: true,
      trustScore: true,
      riskScore: true,
      listingDealType: true,
      updatedAt: true,
    },
  });

  const ids = listings.map((x) => x.id);
  const analyses = ids.length
    ? await prisma.dealAnalysis.findMany({
        where: { propertyId: { in: ids } },
        distinct: ["propertyId"],
        orderBy: { createdAt: "desc" },
        select: {
          propertyId: true,
          confidenceScore: true,
          scenarios: { take: 1, orderBy: { createdAt: "desc" }, select: { annualRoi: true } },
        },
      })
    : [];
  const map = new Map(analyses.map((a) => [a.propertyId ?? "", a]));

  const rows: PropertyCandidate[] = listings.map((l) => {
    const analysis = map.get(l.id);
    const freshnessDays = Math.max(0, Math.floor((Date.now() - l.updatedAt.getTime()) / 86_400_000));
    const intelligence = aggregateListingIntelligence({
      cacheKey: `selection:property:${l.id}`,
      input: {
        priceCents: l.priceCents,
        trustScore: l.trustScore ?? null,
        riskScore: l.riskScore ?? null,
        freshnessDays,
        rentalDemand: l.listingDealType === "RENT_SHORT" ? 80 : 58,
      },
    });

    const personalization = preferredCities.length ? (preferredCities.includes(l.city.toLowerCase()) ? 85 : 45) : 60;

    return {
      id: l.id,
      city: l.city,
      title: l.title,
      priceCents: l.priceCents,
      trustScore: l.trustScore,
      riskScore: intelligence.scores.riskScore,
      listingDealType: l.listingDealType,
      dealScore: intelligence.scores.dealScore,
      confidence: analysis?.confidenceScore ?? intelligence.scores.confidenceScore,
      roi: Number(analysis?.scenarios?.[0]?.annualRoi ?? 0),
      personalization,
    };
  });

  const { bestDeal, safest, cashflow, longTerm, bnhub } = selectPropertyCategoryWinners(rows);

  const out: PropertySelectionResult[] = [];
  if (bestDeal) out.push(mapRow(bestDeal.r, PropertySelectionCategory.BEST_DEAL, bestDeal.score, ["Highest combined deterministic opportunity score"], "contact_now"));
  if (safest) out.push(mapRow(safest.r, PropertySelectionCategory.SAFEST_DEAL, safest.score, ["Strong trust and lower computed risk"], "analyze_more"));
  if (cashflow) out.push(mapRow(cashflow.r, PropertySelectionCategory.BEST_CASHFLOW, cashflow.score, ["Best ROI-oriented deterministic blend"], "analyze_more"));
  if (longTerm) out.push(mapRow(longTerm.r, PropertySelectionCategory.BEST_LONG_TERM, longTerm.score, ["Balanced long-term deterministic profile"], "analyze_more"));
  if (bnhub) out.push(mapRow(bnhub.r, PropertySelectionCategory.BEST_BNHUB_CANDIDATE, bnhub.score, ["Short-term rental candidate fit"], "analyze_more"));

  return out;
}
