import { PRICING } from "@/lib/monetization/pricing";

/** Plan keys for FSBO featured checkout metadata. */
export const FSBO_FEATURED_PLAN_KEYS = ["featured_fsbo_7d", "featured_fsbo_14d", "featured_fsbo_30d"] as const;
export type FsboFeaturedPlanKey = (typeof FSBO_FEATURED_PLAN_KEYS)[number];

export function durationDaysForFsboFeaturedPlan(planKey: string): number {
  if (planKey.includes("7")) return 7;
  if (planKey.includes("14")) return 14;
  return 30;
}

/**
 * Minimum amount (cents) we accept for a featured window — proportional to default 30d anchor price.
 */
export function minAmountCentsForFsboFeaturedPlan(planKey: string): number {
  const days = durationDaysForFsboFeaturedPlan(planKey);
  return Math.max(100, Math.round(PRICING.featuredListingPriceCents * (days / 30)));
}
