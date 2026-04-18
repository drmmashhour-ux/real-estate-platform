/** One Brain V3 — conservative caps (additive; never overrides base ranking alone). */
export const BRAIN_V3_CROSS_DOMAIN_RANKING_CAP = 0.04;
export const BRAIN_V3_CTA_BIAS_CAP = 0.06;
export const BRAIN_V3_PROFIT_PRIORITY_CAP = 0.08;
export const BRAIN_V3_RETARGETING_URGENCY_CAP = 0.12;

/** Minimum aligned observations before a negative direction is treated as reliable. */
export const BRAIN_V3_NEGATIVE_MIN_VOLUME = 3;
/** Higher bar for negatives vs positives (evidenceScore 0–1 in observedMetrics). */
export const BRAIN_V3_NEGATIVE_MIN_EVIDENCE = 0.42;
export const BRAIN_V3_POSITIVE_MIN_EVIDENCE = 0.22;

/** Decay half-life for older observations (days). */
export const BRAIN_V3_DURABILITY_HALF_LIFE_DAYS = 14;
