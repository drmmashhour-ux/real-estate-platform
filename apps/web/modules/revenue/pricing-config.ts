/**
 * Region-based product pricing anchors (CAD). Used by lead pricing engine and admin copy;
 * Stripe amounts are computed in cents elsewhere — do not bypass checkout for paid flows.
 */
export const PRICING_CONFIG = {
  canada: {
    lead: {
      /** [min, max] whole CAD dollars for unlock price interpolation by score band */
      low: [0, 15],
      medium: [30, 80],
      high: [120, 250],
      /** Default anchor (CAD) when interpolating mid-band */
      default: 49,
    },
    /** Platform booking commission fraction (e.g. 0.1 = 10%) — informational; BNHub may use admin override */
    bookingCommission: 0.1,
    /** Featured listing add-on (CAD whole dollars) by duration (days) */
    featuredListing: {
      7: 25,
      14: 50,
    } as const,
    aiPremium: {
      monthly: 19,
    },
  },
} as const;

export type PricingRegionKey = keyof typeof PRICING_CONFIG;
