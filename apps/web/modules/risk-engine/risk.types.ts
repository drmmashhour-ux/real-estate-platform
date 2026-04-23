import type { LecipmDisputeCaseEntityType, LecipmPreDisputeRiskLevel } from "@prisma/client";

export type RiskSignalSource =
  | "booking"
  | "deal"
  | "assistant"
  | "compliance"
  | "autopilot"
  | "payment";

/** Stable keys for dashboards, audits, and explainability (not legal fault codes). */
export type RiskSignalKey =
  | "booking_no_confirmation"
  | "repeated_reschedule"
  | "high_message_friction"
  | "compliance_missing_docs"
  | "compliance_critical_failure"
  | "payment_delay"
  | "negotiation_stall"
  | "assistant_rejection_friction"
  | "autopilot_execution_friction"
  | "repeated_issue_pattern"
  | "negative_feedback_tension"
  | "listing_readiness_gap"
  | "trust_safety_flag";

export type RiskSignal = {
  id: RiskSignalKey;
  weight: number;
  source: RiskSignalSource;
  evidence: string;
  observedAt: string;
};

export type RiskAssessmentResult = {
  riskScore: number;
  riskLevel: LecipmPreDisputeRiskLevel;
  explainLines: string[];
  signals: RiskSignal[];
};

export type PreventionActionRecord = {
  kind: string;
  detail: string;
  at: string;
};

export type PreDisputeRiskAttachment = {
  priorAssessmentAt: string | null;
  riskScore: number | null;
  riskLevel: LecipmPreDisputeRiskLevel | null;
  signals: Array<{ id: RiskSignalKey; source: RiskSignalSource; evidence: string }>;
  explainLines: string[];
  /** Directional hint only — not a determination of fault or outcome. */
  preventableInsight: "elevated_prior_risk" | "moderate_prior_signals" | "limited_prior_signals" | "no_prior_assessment";
};

export type PreDisputeRiskCommandMetrics = {
  assessmentsLast30d: number;
  highOrCriticalLast30d: number;
  riskRateApprox: number | null;
  preventedActionsLast30d: number;
  topSignalKeys: Array<{ key: string; count: number }>;
  note: string;
};

export type RiskEvaluationSubject = {
  type: LecipmDisputeCaseEntityType;
  id: string;
};
