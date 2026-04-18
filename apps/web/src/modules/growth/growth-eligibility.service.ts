import { GROWTH_V2 } from "./growth-v2.constants";

export type InventoryStats = {
  totalActive: number;
  distinctPropertyTypes: number;
  listingsUpdatedLast45d: number;
};

/**
 * Eligibility from real counts only — no synthetic inflation.
 */
export function evaluateSeoInventoryEligibility(stats: InventoryStats): {
  ok: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (stats.totalActive < GROWTH_V2.MIN_ACTIVE_LISTINGS_SEO) {
    reasons.push(`below_min_listings:${stats.totalActive}`);
  }
  if (stats.distinctPropertyTypes < GROWTH_V2.MIN_PROPERTY_TYPE_DIVERSITY) {
    reasons.push(`low_type_diversity:${stats.distinctPropertyTypes}`);
  }
  const freshRatio =
    stats.totalActive > 0 ? stats.listingsUpdatedLast45d / stats.totalActive : 0;
  if (freshRatio < GROWTH_V2.MIN_FRESH_LISTINGS_RATIO) {
    reasons.push(`low_freshness_ratio:${freshRatio.toFixed(3)}`);
  }
  return { ok: reasons.length === 0, reasons };
}
