export const watchlistAlertsConfig = {
  minimumPriceChangePercent: 3,
  minimumDealScoreDelta: 5,
  minimumTrustScoreDelta: 5,
  minimumConfidenceDelta: 6,
  duplicateAlertCooldownHours: 24,
  strongOpportunityThreshold: 78,
  needsReviewThreshold: 60,
  warningTrustThreshold: 45,
  criticalFraudThreshold: 75,

  // Backward-compatible aliases for existing callers.
  minPriceChangePct: 3,
  minDealScoreDelta: 5,
  minTrustScoreDelta: 5,
  strongOpportunityDealScore: 78,
  strongOpportunityTrustScore: 60,
  needsReviewDealScore: 60,
  riskEscalationWarningAt: 55,
  riskEscalationCriticalAt: 75,
} as const;
