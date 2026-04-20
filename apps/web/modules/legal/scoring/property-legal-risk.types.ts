/**
 * Deterministic platform legal-risk modeling — not legal advice; signals publish/review posture only.
 */

export type PropertyLegalRiskLevel = "low" | "guarded" | "elevated" | "high" | "critical";

export type PropertyLegalRiskFactorType =
  | "missing_required_record"
  | "failed_validation"
  | "critical_rule_hit"
  | "fraud_indicator"
  | "identity_unverified"
  | "ownership_unverified"
  | "declaration_incomplete"
  | "registration_missing"
  | "broker_compliance_missing"
  | "rejection_loop"
  | "timeline_anomaly"
  | "manual_review_required";

export type PropertyLegalRiskFactor = {
  id: string;
  type: PropertyLegalRiskFactorType;
  severity: "info" | "warning" | "critical";
  weight: number;
  label: string;
  explanation: string;
  sourceRefs?: string[];
};

export type PropertyLegalRiskScore = {
  listingId: string;
  /** 0–100 — higher = higher platform-assessed legal/compliance risk */
  score: number;
  level: PropertyLegalRiskLevel;
  factors: PropertyLegalRiskFactor[];
  blocking: boolean;
  summary: string;
};

export type PropertyPublishComplianceSummary = {
  listingId: string;
  /** 0–100 — higher = more complete / ready for platform publish requirements */
  readinessScore: number;
  /** 0–100 — higher = riskier */
  legalRiskScore: number;
  blockingIssues: string[];
  warnings: string[];
  requiredChecklistPassed: boolean;
};
