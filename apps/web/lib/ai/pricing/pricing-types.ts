/**
 * BNHUB dynamic pricing — structured outputs (suggestion-only; no live apply here).
 */

export type DynamicPricingRecommendationType =
  | "price_increase_review"
  | "price_decrease_review"
  | "hold_price"
  | "improve_listing_before_price_change";

export type RecommendedPriceRange = {
  /** Major currency units (e.g. dollars), not cents */
  min: number;
  max: number;
  currency: string;
};

export type DynamicPricingPriority = "low" | "medium" | "high";

export type DynamicPricingRecommendation = {
  listingId: string;
  hostId: string;
  type: DynamicPricingRecommendationType;
  title: string;
  summary: string;
  recommendedPriceRange: RecommendedPriceRange | null;
  /** Raw model confidence before host-specific calibration (0–1). */
  confidence: number;
  priority: DynamicPricingPriority;
  reasons: string[];
  /** Stable id for logging, decision engine, and learning. */
  ruleName: string;
  /** Snapshot of inputs used for this evaluation. */
  metricsSnapshot: Record<string, unknown>;
};

/**
 * Explicit safety flag: engine paths must never set live `nightPriceCents` without
 * host action unless a separate approved policy (outside this module) allows it.
 */
export const DYNAMIC_PRICING_LIVE_APPLY_DEFAULT = false as const;

export type DynamicPricingEvaluation = {
  recommendation: DynamicPricingRecommendation;
  rawConfidence: number;
};
