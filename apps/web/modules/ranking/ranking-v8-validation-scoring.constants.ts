/**
 * Thresholds and weights for Ranking V8 validation scorecard (read-only analytics).
 */

/** Max points per category (5 categories × 5 = 25). */
export const RANKING_V8_VALIDATION_MAX_PER_CATEGORY = 5;
export const RANKING_V8_VALIDATION_MAX_TOTAL = 25;

/** Sub-metric point weights within a category (must sum to category max). */
export const RANKING_V8_QUALITY_SUB_WEIGHT = 5 / 4;
export const RANKING_V8_STABILITY_SUB_WEIGHT = 5 / 3;

/** Quality — overlap & shift (see docs for bands). */
export const RANKING_V8_QUALITY_TOP5_STRONG = 0.7;
export const RANKING_V8_QUALITY_TOP5_ACCEPTABLE = 0.6;
export const RANKING_V8_QUALITY_TOP10_STRONG = 0.8;
export const RANKING_V8_QUALITY_TOP10_ACCEPTABLE = 0.7;
export const RANKING_V8_QUALITY_SHIFT_STRONG = 1.2;
export const RANKING_V8_QUALITY_SHIFT_ACCEPTABLE = 2.0;
export const RANKING_V8_QUALITY_IMPROVE_STRONG = 0.1;
export const RANKING_V8_QUALITY_IMPROVE_ACCEPTABLE = 0.05;

/** Stability */
export const RANKING_V8_STAB_REPEAT_STRONG = 0.9;
export const RANKING_V8_STAB_REPEAT_ACCEPTABLE = 0.8;
export const RANKING_V8_STAB_CHURN_STRONG = 0.1;
export const RANKING_V8_STAB_CHURN_ACCEPTABLE = 0.2;
export const RANKING_V8_STAB_JUMP_STRONG = 0.05;
export const RANKING_V8_STAB_JUMP_ACCEPTABLE = 0.1;

/** Rollback / alert thresholds (warnings only). */
export const RANKING_V8_WARN_TOP5_OVERLAP = 0.5;
export const RANKING_V8_WARN_TOP10_OVERLAP = 0.65;
export const RANKING_V8_WARN_AVG_RANK_SHIFT = 2.5;
export const RANKING_V8_WARN_CTR_DROP = -0.03;
export const RANKING_V8_WARN_CONV_DROP = -0.03;
export const RANKING_V8_WARN_STABILITY_SPIKE = 0.35;
export const RANKING_V8_WARN_CHURN = 0.25;
export const RANKING_V8_WARN_LARGE_JUMP = 0.12;
