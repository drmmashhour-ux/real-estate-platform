/**
 * LECIPM workspace subscription revenue metrics (Stripe-backed `subscriptions` table).
 * All amounts are deterministic from DB + Stripe-synced `mrrCents`; null when data is insufficient.
 */

export type RevenueMRRResult = {
  /** Sum of monthly recurring revenue in major currency units (e.g. dollars), 2 decimal places when from cents. */
  mrr: number | null;
  /** Active subscriptions counted toward MRR. */
  activeSubscriptionCount: number;
  /** Subscriptions included in sum but missing `mrrCents` at sync time. */
  subscriptionsMissingMrrCount: number;
};

export type RevenueChurnResult = {
  /** Churn ratio in [0,1]: canceled in window / (active paying + canceled in window). Null if denominator would be 0. */
  churnRate: number | null;
  canceledInWindowCount: number;
  activePayingCount: number;
  windowStart: string;
  windowEnd: string;
};

export type RevenueLTVResult = {
  /** ARPU (MRR / active subscribers) × average months of life among canceled subs; null if not computable. */
  ltv: number | null;
  arpu: number | null;
  averageSubscriberLifetimeMonths: number | null;
  canceledSampleCount: number;
};
