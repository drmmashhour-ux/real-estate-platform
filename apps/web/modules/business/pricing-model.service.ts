import type { FeaturedBoostPackage, LecipmPlanKey, PricingPlanDefinition } from "./pricing-model.types";
import { PRICING_MODEL_ENV, minAmountCentsForFsboFeaturedPlan } from "./pricing-model.constants";

const PLANS: PricingPlanDefinition[] = [
  {
    planKey: "free",
    displayName: "Free",
    feeType: "percent_of_gross",
    bookingFeePercent: PRICING_MODEL_ENV.freeBookingFeePercent,
    monthlySubscriptionCents: 0,
    monthlySubscriptionAmount: 0,
    includedFeatures: ["Basic listing", "Core visibility", "Basic analytics"],
    notes: ["Acquisition tier — fees kept low to reduce friction."],
    recommendedFor: ["New hosts", "Trying the platform"],
    isActive: true,
  },
  {
    planKey: "pro",
    displayName: "Pro",
    feeType: "percent_of_gross",
    bookingFeePercent: PRICING_MODEL_ENV.proBookingFeePercent,
    monthlySubscriptionCents: PRICING_MODEL_ENV.proMonthlySubscriptionCents,
    monthlySubscriptionAmount: PRICING_MODEL_ENV.proMonthlySubscriptionCents / 100,
    includedFeatures: ["Pricing insights", "Better analytics", "Optimization recommendations"],
    notes: ["Primary monetization tier for active hosts."],
    recommendedFor: ["Active STR hosts", "Hosts optimizing revenue"],
    isActive: true,
  },
  {
    planKey: "growth",
    displayName: "Growth",
    feeType: "subscription_plus_percent",
    bookingFeePercent: PRICING_MODEL_ENV.growthBookingFeePercent,
    monthlySubscriptionCents: PRICING_MODEL_ENV.growthMonthlySubscriptionCents,
    monthlySubscriptionAmount: PRICING_MODEL_ENV.growthMonthlySubscriptionCents / 100,
    includedFeatures: [
      "Reduced booking fee vs Pro (when subscription active)",
      "Advanced performance insights",
      "Premium growth tools (roadmap)",
    ],
    notes: [
      "Variant A: subscription + reduced percent fee — configurable via env.",
      "Autopilot hooks are feature-flagged elsewhere; not implied by plan alone.",
    ],
    recommendedFor: ["Portfolio hosts", "High-volume operators"],
    isActive: true,
  },
];

export function getPricingPlans(): PricingPlanDefinition[] {
  return PLANS.map((p) => ({
    ...p,
    includedFeatures: [...p.includedFeatures],
    notes: [...p.notes],
    recommendedFor: p.recommendedFor ? [...p.recommendedFor] : undefined,
  }));
}

export function getPlanByKey(planKey: string): PricingPlanDefinition | null {
  const k = planKey.toLowerCase() as LecipmPlanKey;
  return PLANS.find((p) => p.planKey === k) ?? null;
}

export function calculatePlatformFee(planKey: string, grossRevenueCents: number): number {
  const plan = getPlanByKey(planKey);
  if (!plan || grossRevenueCents <= 0) return 0;
  return Math.round(grossRevenueCents * plan.bookingFeePercent);
}

export function calculateFeaturedBoostPrice(durationDays: 7 | 14 | 30): number {
  const key =
    durationDays === 7 ? "featured_fsbo_7d"
    : durationDays === 14 ? "featured_fsbo_14d"
    : "featured_fsbo_30d";
  return minAmountCentsForFsboFeaturedPlan(key);
}

export function getFeaturedBoostPackages(): FeaturedBoostPackage[] {
  return [
    { key: "featured_fsbo_7d", durationDays: 7, priceCents: calculateFeaturedBoostPrice(7), label: "7-day boost" },
    { key: "featured_fsbo_14d", durationDays: 14, priceCents: calculateFeaturedBoostPrice(14), label: "14-day boost" },
    { key: "featured_fsbo_30d", durationDays: 30, priceCents: calculateFeaturedBoostPrice(30), label: "30-day boost" },
  ];
}
