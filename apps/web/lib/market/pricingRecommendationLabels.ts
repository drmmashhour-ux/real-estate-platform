import type { CityPricingRecommendation } from "@/lib/market/cityPricingEngine";

const LABELS: Record<CityPricingRecommendation["recommendation"], string> = {
  increase_price: "Increase price",
  decrease_price: "Decrease price",
  keep_price: "Keep price",
};

/**
 * Human-readable label for a recommendation `type` (UI, tooltips, email copy).
 */
export function formatPricingRecommendationLabel(
  recommendation: CityPricingRecommendation["recommendation"]
): string {
  return LABELS[recommendation] ?? recommendation;
}
