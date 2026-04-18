/**
 * LECIPM PLATFORM — One Brain V2 conservative defaults and limits.
 */

export const BRAIN_WEIGHT_DEFAULTS = {
  ADS: 1.0,
  CRO: 1.0,
  RETARGETING: 0.9,
  AB_TEST: 1.15,
  PROFIT: 1.2,
  MARKETPLACE: 1.0,
  UNIFIED: 1.1,
} as const;

export const BRAIN_WEIGHT_LIMITS = {
  MIN: 0.5,
  MAX: 1.5,
  MAX_STEP_UP: 0.05,
  MAX_STEP_DOWN: 0.05,
} as const;

export const BRAIN_LEARNING_THRESHOLDS = {
  MIN_OUTCOME_SCORE_TO_REWARD: 0.2,
  MAX_NEGATIVE_THRESHOLD: -0.2,
  MIN_SAMPLE_COUNT_FOR_CONFIDENCE: 5,
} as const;

/** Max ± influence of adaptive trust on ranking blend (One Brain V2 ranking path). */
export const BRAIN_RANKING_ADAPTIVE_CAP = 0.1;
