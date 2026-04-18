/**
 * Canonical signal codes produced by listing/review fraud heuristics.
 * @see listingFraudSignals.ts / reviewFraudSignals.ts
 */
export const FRAUD_SIGNAL_CODES = {
  listing: [
    "duplicate_listing",
    "suspicious_price",
    "inconsistent_location",
    "media_inconsistency",
    "host_behavior_risk",
    "listing_completeness_risk",
  ],
  review: [
    "review_burst",
    "self_review_risk",
    "review_pattern_risk",
    "duplicate_review_text",
    "booking_review_consistency",
  ],
  user: ["account_verification_gap"],
  booking: ["booking_pattern_risk"],
  host: ["host_behavior_risk"],
} as const;

export type FraudSignalCode =
  | (typeof FRAUD_SIGNAL_CODES.listing)[number]
  | (typeof FRAUD_SIGNAL_CODES.review)[number]
  | (typeof FRAUD_SIGNAL_CODES.user)[number]
  | (typeof FRAUD_SIGNAL_CODES.booking)[number]
  | (typeof FRAUD_SIGNAL_CODES.host)[number];
