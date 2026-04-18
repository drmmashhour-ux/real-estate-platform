/**
 * Practical thresholds — not formal significance tests; auditable guardrails.
 */

/** Minimum “impressions” (landing/page views attributed to experiment) per variant before winner talk. */
export const AB_MIN_IMPRESSIONS_PER_VARIANT = 80;

/** Minimum funnel events per variant for lead/booking primary metrics. */
export const AB_MIN_EVENTS_PER_VARIANT = 25;

/** Relative gap required on primary rate metric to call a winner (e.g. CTR 0.04 vs 0.035). */
export const AB_WINNER_RELATIVE_GAP = 0.12;

/** If top two within this relative band → inconclusive. */
export const AB_INCONCLUSIVE_BAND = 0.06;

export const AB_DECISION_TYPES = {
  WINNER_FOUND: "winner_found",
  INCONCLUSIVE: "inconclusive",
  INSUFFICIENT_DATA: "insufficient_data",
} as const;
