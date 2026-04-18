import { PRICING } from "@/lib/monetization/pricing";
import { PRICING_MODEL_ENV } from "@/modules/business/pricing-model.constants";
import { BNHUB_GUEST_SERVICE_FEE_PERCENT, BNHUB_HOST_FEE_PERCENT } from "@/lib/bnhub/booking-pricing";

/**
 * Internal anchors from product config — merged into simulation with explicit labeling.
 */
export function getAssumptionRegistry(): {
  leadPriceCad: number;
  featuredBoostCad: number;
  promotedListingCad: number;
  proHostMonthlyCad: number;
  growthHostMonthlyCad: number;
  /** Sum of guest % + host % on lodging subtotal — proxy for “fee stack” education, not tax advice */
  bnhubStatedFeePercentOfLodging: number;
  /** Optional LECIPM plan booking fee anchor (marketing / host plan) */
  lecipmMarketingBookingFeePercent: number;
  sources: string[];
} {
  return {
    leadPriceCad: PRICING.leadPriceCents / 100,
    featuredBoostCad: PRICING.featuredListingPriceCents / 100,
    promotedListingCad: PRICING.promotedListingPriceCents / 100,
    proHostMonthlyCad: PRICING.hostTiers.PRO.monthlyCents / 100,
    growthHostMonthlyCad: PRICING_MODEL_ENV.growthMonthlySubscriptionCents / 100,
    bnhubStatedFeePercentOfLodging: BNHUB_GUEST_SERVICE_FEE_PERCENT + BNHUB_HOST_FEE_PERCENT,
    lecipmMarketingBookingFeePercent: PRICING.bookingFeePercent,
    sources: [
      "lib/monetization/pricing.ts",
      "modules/business/pricing-model.constants.ts (PRICING_MODEL_ENV)",
      "lib/bnhub/booking-pricing.ts (BNHUB_GUEST_SERVICE_FEE_PERCENT, BNHUB_HOST_FEE_PERCENT)",
    ],
  };
}
