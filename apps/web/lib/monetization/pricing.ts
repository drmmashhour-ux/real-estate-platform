/**
 * Central monetization knobs (CAD minor units where cents; percents as decimals).
 * Wire real billing to Stripe / ledger separately — this is the product config surface.
 */
export const PRICING = {
  /** Platform take of confirmed booking GMV (e.g. 0.10 = 10%). */
  bookingFeePercent: 0.1,
  /** Pay-per-qualified-lead (broker-style), CAD cents. */
  leadPriceCents: 27_500,
  /** Featured listing — monthly promo slot, CAD cents. */
  featuredListingPriceCents: 2_000,
  /** Promoted placement add-on, CAD cents. */
  promotedListingPriceCents: 3_500,
  hostTiers: {
    FREE: { monthlyCents: 0, listingCap: 1 },
    PRO: { monthlyCents: 4_900, listingCap: 5 },
    PLATINUM: { monthlyCents: 12_900, listingCap: 25 },
  },
} as const;

/** CAD whole dollars for dashboards / copy (minor units live in `*Cents` fields). */
export const PRICING_CAD = {
  leadPrice: PRICING.leadPriceCents / 100,
  featuredListingMonthly: PRICING.featuredListingPriceCents / 100,
} as const;

export type HostTierKey = keyof typeof PRICING.hostTiers;
