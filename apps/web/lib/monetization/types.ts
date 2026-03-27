/**
 * Monetization – types and constants.
 */

export const REVENUE_TYPES = [
  "guest_service_fee",
  "host_fee",
  "transaction_fee",
  "subscription",
  "promotion",
  "refund_reversal",
  "ai_premium",
] as const;
export type RevenueType = (typeof REVENUE_TYPES)[number];

export const ENTITY_TYPES = ["booking", "transaction", "subscription", "promotion", "ai_feature"] as const;

export interface BookingFeeBreakdown {
  subtotalCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  guestServiceFeeCents: number;
  hostFeeCents: number;
  totalCents: number;
  hostPayoutCents: number;
  platformRevenueCents: number; // guest fee + host fee
  currency: string;
}

export interface TransactionFeeBreakdown {
  transactionValueCents: number;
  platformFeeCents: number;
  currency: string;
}

export interface EntitlementCheck {
  featureName: string;
  requiredPlanSlug: string | null;
  accessStatus: "granted" | "denied" | "trial";
  reason?: string;
}
