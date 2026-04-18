/**
 * Tunable thresholds — single source for `riskScoringEngine.classifyRiskLevel` and review routing.
 * Slightly raised vs v1 to cut borderline false positives while keeping real risk visible.
 */
export const FRAUD_RISK_THRESHOLDS = {
  medium: 0.28,
  high: 0.52,
  critical: 0.78,
} as const;

/** Minimum normalized signal strength to surface as an open fraud_flag */
export const FRAUD_FLAG_STRENGTH_FLOOR = 0.22;
