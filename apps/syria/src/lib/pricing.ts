/** Tunable monetization constants — no hidden fees in UI copy. */
export const SYRIA_PRICING = {
  listingFeeAmount: Number(process.env.SYRIA_LISTING_FEE_AMOUNT ?? "50000"),
  /** Aligns with F1 bucket-0 baseline; F1 WhatsApp upgrades use `syria-f1-pricing.config`. */
  featuredBoostAmount: Number(process.env.SYRIA_FEATURED_FEE_AMOUNT ?? "50000"),
  /** One-time premium / luxury boost — higher than featured. */
  premiumBoostAmount: Number(process.env.SYRIA_PREMIUM_FEE_AMOUNT ?? "120000"),
  /** Platform commission rate on BNHub gross (e.g. 0.12 = 12%). */
  bnhubCommissionRate: Number(process.env.SYRIA_BNHUB_COMMISSION_RATE ?? "0.12"),
  currency: process.env.SYRIA_DEFAULT_CURRENCY ?? "SYP",
} as const;
