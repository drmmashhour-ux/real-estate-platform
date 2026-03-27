import type {
  CalibrationBatchStatus,
  CalibrationDriftAlertStatus,
  CalibrationDriftSeverity,
} from "@prisma/client";
import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";

export type { CalibrationBatchStatus, CalibrationDriftAlertStatus, CalibrationDriftSeverity };

/** Snapshot stored on `calibration_batches.metrics_json` after a successful run. */
export type CalibrationBatchMetricsSnapshot = CalibrationMetrics & {
  strongOpportunityShare: number | null;
};

export type CompositionTargets = {
  strong?: number;
  average?: number;
  weakIncomplete?: number;
  suspicious?: number;
};

export type ListingSegmentJson = {
  propertyKind: "condo" | "house" | "other";
  rental: boolean;
  bnhub: boolean;
  brokerListed: boolean;
  city: string;
};

export type DriftThresholds = {
  trustAgreementDrop: number;
  dealAgreementDrop: number;
  fpHighTrustRise: number;
  fpStrongOpportunityRise: number;
  lowConfidenceConcentrationDrop: number;
  segmentAgreementGap: number;
  strongOpportunityShareShift: number;
};

export const DEFAULT_DRIFT_THRESHOLDS: DriftThresholds = {
  trustAgreementDrop: 0.05,
  dealAgreementDrop: 0.05,
  fpHighTrustRise: 0.03,
  fpStrongOpportunityRise: 0.02,
  lowConfidenceConcentrationDrop: 0.05,
  segmentAgreementGap: 0.1,
  strongOpportunityShareShift: 0.05,
};

export type SegmentPerformanceRow = {
  segmentKey: string;
  itemCount: number;
  trustAgreementRate: number | null;
  dealAgreementRate: number | null;
  riskAgreementRate: number | null;
};

export type DriftSummary = {
  alertCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
};

export type TuningReviewRecommendation = {
  tuningReviewRecommended: boolean;
  reasons: string[];
};

export type CalibrationHealthSummary = {
  activeProductionProfile: {
    id: string;
    name: string | null;
    isActive: boolean;
    createdAt: string;
  } | null;
  latestBatch: {
    id: string;
    name: string | null;
    status: CalibrationBatchStatus;
    listingCount: number;
    createdAt: string;
    completedAt: string | null;
    metrics: CalibrationBatchMetricsSnapshot | null;
  } | null;
  lastFiveBatches: {
    id: string;
    name: string | null;
    status: CalibrationBatchStatus;
    listingCount: number;
    createdAt: string;
    completedAt: string | null;
    metrics: CalibrationBatchMetricsSnapshot | null;
    tuningReviewRecommended: boolean | null;
  }[];
  trends: {
    trustAgreement: (number | null)[];
    dealAgreement: (number | null)[];
    fpHighTrust: (number | null)[];
    fpStrongOpportunity: (number | null)[];
    lowConfDisagreementConcentration: (number | null)[];
  };
};
