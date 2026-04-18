/**
 * Fusion-local learning policy — conservative caps; prefer no adjustment over risky drift.
 */

/** Minimum linked outcomes with non-unknown success before applying weight nudges. */
export const GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT = 8;

/** Max absolute delta applied to any single source weight in one learning run. */
export const GF_LEARN_MAX_WEIGHT_DELTA_PER_RUN = 0.02;

/** Max L1 drift from default weights (sum of abs deltas from defaults). */
export const GF_LEARN_MAX_TOTAL_DRIFT_FROM_DEFAULT = 0.12;

/** Evidence score below this blocks adaptation for that run. */
export const GF_LEARN_LOW_EVIDENCE_BLOCK_THRESHOLD = 0.22;

/** Ignore synthetic outcomes older than this (ms) when evaluating — linker uses fresh snapshot only. */
export const GF_LEARN_STALE_OUTCOME_IGNORE_MS = 7 * 24 * 60 * 60 * 1000;

/** Default lookback for learning cycle (passed to control center load). */
export const GF_LEARN_DEFAULT_LOOKBACK_DAYS = 14;

/** Smoothing for weight updates (0 = no memory, 1 = ignore new). */
export const GF_LEARN_WEIGHT_SMOOTHING = 0.35;

/** Unsafe: too many conflicts relative to signals — block adaptation. */
export const GF_LEARN_MAX_CONFLICT_RATIO_FOR_ADAPT = 0.65;

/** Minimum signals required to run evaluation. */
export const GF_LEARN_MIN_SIGNALS = 2;
