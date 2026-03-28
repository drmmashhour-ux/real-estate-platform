/**
 * LECIPM fraud / trust-risk feature flags (default off in production unless set).
 */
export function isFraudDetectionEnabled(): boolean {
  return process.env.AI_FRAUD_DETECTION_ENABLED === "1";
}

export function isFraudSoftRankingPenaltyEnabled(): boolean {
  return process.env.AI_FRAUD_SOFT_RANKING_PENALTY_ENABLED === "1";
}

export function isFraudReviewHoldEnabled(): boolean {
  return process.env.AI_FRAUD_REVIEW_HOLD_ENABLED === "1";
}
