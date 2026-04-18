export type PricingFeeType = "percent_of_gross" | "subscription_plus_percent" | "fixed_boost";

export type LecipmPlanKey = "free" | "pro" | "growth";

export type PricingPlanDefinition = {
  planKey: LecipmPlanKey;
  displayName: string;
  feeType: PricingFeeType;
  /** Booking / platform fee on gross booking revenue (0–1). */
  bookingFeePercent: number;
  /** Monthly subscription in CAD cents (Growth variant A). */
  monthlySubscriptionCents: number;
  /** Convenience: major currency units / month (derived from cents in service). */
  monthlySubscriptionAmount?: number;
  includedFeatures: string[];
  notes: string[];
  recommendedFor?: string[];
  isActive?: boolean;
};

export type FeaturedBoostPackage = {
  key: string;
  durationDays: number;
  priceCents: number;
  label: string;
};
