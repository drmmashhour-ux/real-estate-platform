import { PRICING } from "@/lib/monetization/pricing";
import { minAmountCentsForFsboFeaturedPlan } from "@/lib/featured/fsbo-featured-plans";

function envPct(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(0.5, n)) : fallback;
}

function envCents(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (v == null || v === "") return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Configurable LECIPM host economics — env overrides with safe defaults.
 * Public copy must still be caveated; this is product configuration, not a market survey.
 */
export const PRICING_MODEL_ENV = {
  freeBookingFeePercent: envPct("LECIPM_FREE_BOOKING_FEE_PERCENT", 0.03),
  proBookingFeePercent: envPct("LECIPM_PRO_BOOKING_FEE_PERCENT", 0.07),
  /** Growth variant A: lower take + subscription. */
  growthBookingFeePercent: envPct("LECIPM_GROWTH_BOOKING_FEE_PERCENT", 0.05),
  growthMonthlySubscriptionCents: envCents("LECIPM_GROWTH_MONTHLY_SUBSCRIPTION_CENTS", 9900),
  proMonthlySubscriptionCents: envCents("LECIPM_PRO_MONTHLY_SUBSCRIPTION_CENTS", 0),
  /** Anchor for featured boosts — aligns with `PRICING.featuredListingPriceCents` scale. */
  featuredBaseMonthlyCents: PRICING.featuredListingPriceCents,
} as const;

export { minAmountCentsForFsboFeaturedPlan };
