import { PRICING } from "@/lib/monetization/pricing";
import { PRICING_MODEL_ENV } from "@/modules/business/pricing-model.constants";
import type { RevenueStreamRow } from "./monetization.types";

/**
 * Human-readable revenue map — amounts come from `lib/monetization/pricing` + host plan env.
 */
export function listRevenueStreams(): RevenueStreamRow[] {
  return [
    {
      id: "bnhub_booking_fee",
      label: "BNHub booking fee (platform)",
      description: "Percent of lodging GMV + guest service fee path (see BNHub checkout breakdown).",
      configSource: "lib/bnhub/booking-pricing.ts + PRICING.bookingFeePercent (marketing)",
    },
    {
      id: "bnhub_featured_boost",
      label: "Featured / boost placements",
      description: "FSBO / listing promotional windows.",
      configSource: "modules/business getFeaturedBoostPackages + featured plans",
    },
    {
      id: "bnhub_host_subscription",
      label: "Host subscription (Pro / Growth)",
      description: "Monthly subscription + plan-specific booking fee %.",
      configSource: "LECIPM_*_BOOKING_FEE_PERCENT, LECIPM_GROWTH_MONTHLY_SUBSCRIPTION_CENTS",
    },
    {
      id: "broker_pay_per_lead",
      label: "Pay-per-lead",
      description: "Qualified lead purchase (when product enabled).",
      configSource: `lib/monetization/pricing PRICING.leadPriceCents (${PRICING.leadPriceCents}¢)`,
    },
    {
      id: "broker_success_fee",
      label: "Success / platform fee on commission",
      description: "Configurable in deal/billing rules — not a fixed public % here.",
      configSource: "Deal execution + PlatformCommissionRecord (see finance policy)",
    },
    {
      id: "broker_crm_subscription",
      label: "Broker CRM / AI tools subscription",
      description: "Optional subscription surfaces (feature-flagged).",
      configSource: "Stripe product catalog / entitlements",
    },
    {
      id: "broker_document_fee",
      label: "Document generation add-on",
      description: "Small per-use or bundle fees where enabled.",
      configSource: "Contract engine billing hooks",
    },
    {
      id: "upsell_featured_listing",
      label: "Featured listing (monthly)",
      description: "PRICING.featuredListingPriceCents",
      configSource: `${PRICING.featuredListingPriceCents}¢ CAD`,
    },
    {
      id: "upsell_marketing_boost",
      label: "Promoted placement",
      description: "PRICING.promotedListingPriceCents",
      configSource: `${PRICING.promotedListingPriceCents}¢ CAD`,
    },
    {
      id: "upsell_analytics",
      label: "Analytics premium",
      description: "Gated dashboards — tie to subscription SKU when active.",
      configSource: "Feature flags + billing",
    },
  ];
}

export function getMonetizationEnvSummary() {
  return {
    generatedAt: new Date().toISOString(),
    leadPriceCents: PRICING.leadPriceCents,
    featuredListingPriceCents: PRICING.featuredListingPriceCents,
    hostTierKeys: Object.keys(PRICING.hostTiers),
    planFeePercents: {
      free: PRICING_MODEL_ENV.freeBookingFeePercent,
      pro: PRICING_MODEL_ENV.proBookingFeePercent,
      growth: PRICING_MODEL_ENV.growthBookingFeePercent,
    },
  };
}
