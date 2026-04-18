/**
 * Pricing Engine v4 — structured recommendation (not an appraisal).
 */

export type PricingStrategy =
  | "competitive"
  | "demand_based"
  | "occupancy_optimization"
  | "premium_quality"
  | "stale_discount";

export type PricingRecommendation = {
  recommendedPriceCents: number;
  priceRangeCents: { min: number; max: number };
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  reasoning: string[];
  expectedImpact: string;
  strategy: PricingStrategy;
  dataQualityNote?: string;
  /** Peer median list price (major units), when comparables exist. */
  marketMedian: number | null;
  /** Count of internal comparable rows used for median (not an external market claim). */
  marketSampleSize: number;
  /** True when peer sample is thin or median unavailable — never masked as high confidence. */
  lowConfidence: boolean;
};
