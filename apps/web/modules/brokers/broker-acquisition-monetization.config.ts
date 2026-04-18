/**
 * Broker acquisition monetization hints — env-driven; no fake metrics.
 * Lead unlock pricing for CRM remains in revenue-control settings + lead-pricing.service.
 */

function envNum(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** CAD — illustrative pay-per-lead reference for operators (not Stripe substitution). */
export const brokerAcquisitionMonetizationConfig = {
  /** Reference price per CRM lead unlock for ops math (actual charge uses dynamic pricing). */
  brokerLeadPriceCad: envNum("BROKER_ACQUISITION_LEAD_PRICE_CAD", 29),
  /** First N unlocks free messaging for onboarding brokers (operator narrative). */
  freeLeadQuota: envNum("BROKER_ACQUISITION_FREE_LEAD_QUOTA", 3),
  /**
   * Optional uplift % shown when comparing featured visibility — set when you have cohort data.
   * If unset, dashboard shows "configure BROKER_FEATURED_VIEW_UPLIFT_PERCENT" instead of inventing a number.
   */
  featuredListingViewUpliftPercent: (() => {
    const v = process.env.BROKER_FEATURED_VIEW_UPLIFT_PERCENT;
    if (v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n < 500 ? n : null;
  })(),
} as const;
