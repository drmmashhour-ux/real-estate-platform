/**
 * F1 (مميز / فاخر) manual upgrade pricing — SYP, 7-day window (`SYRIA_FEATURED_DURATION_DAYS`).
 * **Price ladder:** higher list prices for listings that already have public view count (server is source of truth).
 */

export const F1_BASELINE_SYP = {
  featured: 50_000,
  premium: 120_000,
} as const;

/** Hard caps (safety) — never charge above these. */
export const F1_LADDER_CAP_SYP = {
  featured: 100_000,
  premium: 200_000,
} as const;

function clamp(plan: "featured" | "premium", n: number): number {
  return Math.min(n, F1_LADDER_CAP_SYP[plan]);
}

/**
 * Tier 0: views < 10 → 50k / 120k  
 * Tier 1: 10–24 → 70k / 150k  
 * Tier 2: 25+ → 90k / 180k (capped at 100k / 200k).
 */
export function f1ViewTierAndPrices(views: number): {
  tier: 0 | 1 | 2;
  featured: number;
  premium: number;
  /** Show CTA line: listing already gets attention → higher promo price. */
  showLadderHint: boolean;
} {
  const v = Math.max(0, Math.floor(views));
  let tier: 0 | 1 | 2 = 0;
  let rawFeatured: number = F1_BASELINE_SYP.featured;
  let rawPremium: number = F1_BASELINE_SYP.premium;
  if (v >= 25) {
    tier = 2;
    rawFeatured = 90_000;
    rawPremium = 180_000;
  } else if (v >= 10) {
    tier = 1;
    rawFeatured = 70_000;
    rawPremium = 150_000;
  }
  return {
    tier,
    featured: clamp("featured", rawFeatured),
    premium: clamp("premium", rawPremium),
    showLadderHint: v >= 10,
  };
}

export function f1AmountForPlanFromViews(plan: "featured" | "premium", views: number): number {
  const p = f1ViewTierAndPrices(views);
  return plan === "featured" ? p.featured : p.premium;
}
