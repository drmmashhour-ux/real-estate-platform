import type { ModelValidationItem, ModelValidationRunKind, ModelValidationRunStatus } from "@prisma/client";

export type { ModelValidationRunStatus, ModelValidationRunKind };

/** Stored as JSON on items — issue codes from trust/fraud pipelines */
export type PredictedIssueCodes = string[];

export type CreateValidationRunInput = {
  name?: string | null;
  description?: string | null;
  createdBy?: string | null;
  validationRunKind?: ModelValidationRunKind;
  appliedTuningProfileId?: string | null;
  comparisonTargetRunId?: string | null;
};

export type AddValidationItemInput = {
  entityType: string;
  entityId: string;
  predictedTrustScore?: number | null;
  predictedTrustConfidence?: number | null;
  predictedDealScore?: number | null;
  predictedDealConfidence?: number | null;
  predictedFraudScore?: number | null;
  predictedRecommendation?: string | null;
  predictedIssueCodes?: PredictedIssueCodes | null;
  humanTrustLabel?: string | null;
  humanDealLabel?: string | null;
  humanRiskLabel?: string | null;
  fairnessRating?: number | null;
  wouldPublish?: boolean | null;
  wouldContact?: boolean | null;
  wouldInvestigateFurther?: boolean | null;
  needsManualReview?: boolean | null;
  reviewerNotes?: string | null;
  /** When set with fillFromEngine, trust/deal use this tuning profile (non-persisted scoring). */
  tuningProfileId?: string | null;
};

export type MetricDeltaDirection = "improved" | "unchanged" | "worsened";

export type MetricDeltaEntry = {
  base: number | null;
  comparison: number | null;
  delta: number | null;
  direction: MetricDeltaDirection;
};

export type ValidationMetricsDelta = {
  trustAgreementRate: MetricDeltaEntry;
  dealAgreementRate: MetricDeltaEntry;
  riskAgreementRate: MetricDeltaEntry;
  falsePositiveHighTrustRate: MetricDeltaEntry;
  falsePositiveStrongOpportunityRate: MetricDeltaEntry;
  averageFairnessRating: MetricDeltaEntry;
  manualReviewRate: MetricDeltaEntry;
  lowConfidenceDisagreementConcentration: MetricDeltaEntry;
  totalAgreementRate: MetricDeltaEntry;
};

export type CalibrationMetrics = {
  itemCount: number;
  /** Items with all three human labels set */
  fullyLabeledCount: number;
  /** Share of fully labeled rows where all three agreements are true */
  totalAgreementRate: number | null;
  trustAgreementRate: number | null;
  dealAgreementRate: number | null;
  riskAgreementRate: number | null;
  /** Predicted high/verified trust but human bucket is low */
  falsePositiveHighTrustRate: number | null;
  /** Predicted strong_opportunity but human negative */
  falsePositiveStrongOpportunityRate: number | null;
  manualReviewRate: number | null;
  averageFairnessRating: number | null;
  /** Among rows with any disagreement, share where trust or deal confidence is low (<40) — higher = more honest uncertainty when wrong */
  lowConfidenceDisagreementConcentration: number | null;
};

export type RunDetailPayload = {
  run: {
    id: string;
    name: string | null;
    description: string | null;
    status: ModelValidationRunStatus;
    validationRunKind: ModelValidationRunKind;
    appliedTuningProfileId: string | null;
    comparisonTargetRunId: string | null;
    createdBy: string | null;
    createdAt: Date;
    completedAt: Date | null;
  };
  metrics: CalibrationMetrics;
  items: ModelValidationItem[];
};
