/**
 * Conservative caps for local growth learning — orchestration only.
 */

/** Minimum evaluated outcomes (non–insufficient_data) before any weight nudge. */
export const GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT = 5;

/** Max absolute change per weight dimension in one cycle. */
export const GROWTH_LEARNING_MAX_WEIGHT_ADJUSTMENT_PER_RUN = 0.05;

/** Each weight must stay within [1 - drift, 1 + drift] of neutral 1.0. */
export const GROWTH_LEARNING_MAX_TOTAL_DRIFT = 0.25;

/** Below this many usable outcomes → evaluate-only / no adaptation. */
export const GROWTH_LEARNING_LOW_EVIDENCE_THRESHOLD = 3;

/** Blend when merging adjustments (higher = smoother). */
export const GROWTH_LEARNING_SMOOTHING_FACTOR = 0.35;

/** Gentle pull of weights toward neutral between runs (in-memory only). */
export const GROWTH_LEARNING_DECAY_FACTOR = 0.98;

export const GROWTH_LEARNING_NEUTRAL_WEIGHT = 1;
