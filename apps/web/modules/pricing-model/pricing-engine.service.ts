import { getPricingPlans, getFeaturedBoostPackages, getPricingModelExplanation } from "@/modules/business";
import { PRICING } from "@/lib/monetization/pricing";
import { PRICING_MODEL_ENV } from "@/modules/business/pricing-model.constants";
import { BNHUB_GUEST_SERVICE_FEE_PERCENT, BNHUB_HOST_FEE_PERCENT } from "@/lib/bnhub/booking-pricing";

/**
 * Single snapshot for pricing APIs — transparent, config-backed, no fabricated savings.
 */
export function buildPlatformPricingSnapshot(): {
  generatedAt: string;
  bnhub: {
    guestServiceFeePercent: number;
    hostPlatformFeePercentOnLodging: number;
    /** Legacy / marketing `PRICING.bookingFeePercent` — document if different from checkout. */
    marketingBookingFeePercent: number;
  };
  hostPlans: ReturnType<typeof getPricingPlans>;
  featuredBoosts: ReturnType<typeof getFeaturedBoostPackages>;
  brokerage: {
    payPerLeadCents: number;
    featuredListingMonthlyCents: number;
    promotedListingCents: number;
  };
  envSnapshot: {
    freeBookingFeePercent: number;
    proBookingFeePercent: number;
    growthBookingFeePercent: number;
    growthMonthlySubscriptionCents: number;
    proMonthlySubscriptionCents: number;
  };
  explainer: ReturnType<typeof getPricingModelExplanation>;
  disclaimers: string[];
} {
  return {
    generatedAt: new Date().toISOString(),
    bnhub: {
      guestServiceFeePercent: BNHUB_GUEST_SERVICE_FEE_PERCENT,
      hostPlatformFeePercentOnLodging: BNHUB_HOST_FEE_PERCENT,
      marketingBookingFeePercent: PRICING.bookingFeePercent,
    },
    hostPlans: getPricingPlans(),
    featuredBoosts: getFeaturedBoostPackages(),
    brokerage: {
      payPerLeadCents: PRICING.leadPriceCents,
      featuredListingMonthlyCents: PRICING.featuredListingPriceCents,
      promotedListingCents: PRICING.promotedListingPriceCents,
    },
    envSnapshot: {
      freeBookingFeePercent: PRICING_MODEL_ENV.freeBookingFeePercent,
      proBookingFeePercent: PRICING_MODEL_ENV.proBookingFeePercent,
      growthBookingFeePercent: PRICING_MODEL_ENV.growthBookingFeePercent,
      growthMonthlySubscriptionCents: PRICING_MODEL_ENV.growthMonthlySubscriptionCents,
      proMonthlySubscriptionCents: PRICING_MODEL_ENV.proMonthlySubscriptionCents,
    },
    explainer: getPricingModelExplanation(),
    disclaimers: [
      "BNHub checkout uses guest + host % on lodging subtotal; host subscription plans add separate booking % on GMV via business rules.",
      "`marketingBookingFeePercent` may differ from live checkout — always show checkout breakdown to guests.",
    ],
  };
}
