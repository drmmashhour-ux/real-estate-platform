import type { PricingRecommendation, PricingStrategy } from "./pricing.model";

export function labelForStrategy(s: PricingStrategy): string {
  switch (s) {
    case "competitive":
      return "Align with peer median in the same city (and property type when available).";
    case "demand_based":
      return "Adjust using observed demand (views/leads) versus peers.";
    case "occupancy_optimization":
      return "BNHub: balance nightly rate with occupancy / booking signals.";
    case "premium_quality":
      return "Higher trust/quality signals may support a modest premium within band.";
    case "stale_discount":
      return "Stale listing — consider a bounded decrease to restore interest.";
    default:
      return "Heuristic recommendation.";
  }
}

export function expectedImpactTemplate(strategy: PricingStrategy, pctRange: string): string {
  return `Indicative direction only (${strategy}): ${pctRange}. Not a guaranteed revenue outcome — depends on market response.`;
}

/** Stable JSON shape for APIs / internal tools (major currency units + explainability). */
export function toPricingEngineApiShape(rec: PricingRecommendation) {
  return {
    recommendedPrice: rec.recommendedPriceCents / 100,
    minPrice: rec.priceRangeCents.min / 100,
    maxPrice: rec.priceRangeCents.max / 100,
    confidence: rec.confidence,
    reasoning: rec.reasoning,
    expectedImpact: rec.expectedImpact,
    /** Alias for product copy — same bounded copy as `expectedImpact` (not a guaranteed forecast). */
    expectedRevenueImpact: rec.expectedImpact,
    marketMedian: rec.marketMedian,
    marketSampleSize: rec.marketSampleSize,
    comparableCount: rec.marketSampleSize,
    lowConfidence: rec.lowConfidence,
    strategy: rec.strategy,
    dataQualityNote: rec.dataQualityNote,
  };
}
