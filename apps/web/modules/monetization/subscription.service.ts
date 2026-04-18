import { PRICING } from "@/lib/monetization/pricing";
import { PRICING_MODEL_ENV } from "@/modules/business/pricing-model.constants";

export type HostTierOffer = {
  key: keyof typeof PRICING.hostTiers;
  monthlyCents: number;
  listingCap: number;
};

/** Marketing tiers from `PRICING.hostTiers` — billing may use parallel Stripe products. */
export function listHostTierOffers(): HostTierOffer[] {
  return (Object.keys(PRICING.hostTiers) as (keyof typeof PRICING.hostTiers)[]).map((key) => ({
    key,
    monthlyCents: PRICING.hostTiers[key].monthlyCents,
    listingCap: PRICING.hostTiers[key].listingCap,
  }));
}

export function getGrowthPlanSubscriptionCents(): number {
  return PRICING_MODEL_ENV.growthMonthlySubscriptionCents;
}
