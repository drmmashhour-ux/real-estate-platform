/**
 * Fusion-local governance thresholds — conservative; prefer watch/caution over freeze.
 */

/** Primary monitoring runs before rollback recommendation is allowed. */
export const GF_GOV_MIN_RUNS_FOR_ROLLBACK = 12;

/** Fallback rate tiers (rolling rates from Phase D). */
export const GF_GOV_FALLBACK_WATCH = 0.22;
export const GF_GOV_FALLBACK_CAUTION = 0.38;
export const GF_GOV_FALLBACK_ROLLBACK = 0.52;

export const GF_GOV_MISSING_WATCH = 0.35;
export const GF_GOV_MISSING_CAUTION = 0.5;

export const GF_GOV_CONFLICT_CAUTION = 0.42;
export const GF_GOV_CONFLICT_FREEZE = 0.55;

export const GF_GOV_DISAGREE_CAUTION = 0.42;

export const GF_GOV_LOW_EVIDENCE_CAUTION = 0.48;

export const GF_GOV_ANOMALY_CAUTION = 0.28;
export const GF_GOV_ANOMALY_ROLLBACK = 0.42;

export const GF_GOV_UNSTABLE_ORDER_CAUTION = 0.22;

export const GF_GOV_WEIGHT_DRIFT_WATCH = 0.08;
export const GF_GOV_WEIGHT_DRIFT_FREEZE = 0.12;

export const GF_GOV_LEARNING_HIT_CAUTION = 0.42;

/** Consecutive evaluation cycles at caution+ before escalating to rollback recommendation. */
export const GF_GOV_CONSECUTIVE_CAUTION_FOR_ROLLBACK = 4;
