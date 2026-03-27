import { prisma } from "@/lib/db";
import { aggregateListingIntelligence } from "@/src/core/intelligence/aggregation/aggregationEngine";
import { StrategyRecommendation } from "@/src/modules/ai-selection-engine/domain/selection.enums";
import type { StrategySelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export async function selectStrategyForProperty(propertyId: string): Promise<StrategySelectionResult> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: propertyId },
    select: { id: true, listingDealType: true, trustScore: true, riskScore: true, priceCents: true, updatedAt: true },
  });

  const intelligence = aggregateListingIntelligence({
    cacheKey: `selection:strategy:${propertyId}`,
    input: {
      priceCents: listing?.priceCents ?? 0,
      trustScore: listing?.trustScore ?? null,
      riskScore: listing?.riskScore ?? null,
      freshnessDays: listing ? Math.max(0, Math.floor((Date.now() - listing.updatedAt.getTime()) / 86_400_000)) : 7,
      rentalDemand: listing?.listingDealType === "RENT_SHORT" ? 80 : 58,
    },
  });

  const strategy = (intelligence.selection.bestStrategies[0]?.recommendedAction ?? "avoid") as StrategyRecommendation;
  const strategyScore = intelligence.selection.bestStrategies[0]?.score ?? intelligence.scores.dealScore;

  return {
    id: `${propertyId}:${strategy}`,
    propertyId,
    type: "strategy",
    strategy,
    score: strategyScore,
    confidence: intelligence.confidence,
    reasons: intelligence.explanation.keyFactors.slice(0, 2),
    recommendedAction: strategy === StrategyRecommendation.AVOID ? "ignore" : "analyze_more",
  };
}
