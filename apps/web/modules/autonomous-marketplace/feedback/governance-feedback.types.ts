/**
 * Outcome feedback & self-improving governance v1 — additive types only (no threshold mutation).
 */

export type GovernanceOutcomeLabel =
  | "GOOD_BLOCK"
  | "BAD_BLOCK"
  | "GOOD_APPROVAL"
  | "BAD_APPROVAL"
  | "GOOD_EXECUTION"
  | "BAD_EXECUTION"
  | "MISSED_RISK"
  | "INSUFFICIENT_DATA";

export type GovernanceGroundTruthEventType =
  | "refund"
  | "chargeback"
  | "payout_reversal"
  | "fraud_confirmed"
  | "fraud_cleared"
  | "manual_approval_granted"
  | "manual_approval_rejected"
  | "execution_succeeded"
  | "execution_failed"
  | "listing_removed"
  | "listing_restored"
  | "trust_escalation_opened"
  | "trust_escalation_closed";

export interface GovernancePredictionSnapshot {
  governanceDisposition: string;
  blocked: boolean;
  requiresHumanApproval: boolean;
  allowExecution: boolean;

  policyDecision?: string;

  legalRiskScore: number;
  legalRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  fraudRiskScore: number;
  fraudRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  combinedRiskScore: number;
  combinedRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  revenueImpactEstimate?: number;

  trace?: Array<{
    step: number;
    ruleId: string;
    matched: boolean;
    outcome?: string;
    reason?: string;
  }>;
}

export interface GovernanceGroundTruthEvent {
  type: GovernanceGroundTruthEventType;
  occurredAt: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface GovernanceFeedbackInput {
  runId?: string;
  entityType?: string;
  entityId?: string;
  listingId?: string;
  listingDisplayId?: string;
  bookingId?: string;
  payoutId?: string;
  userId?: string;
  regionCode?: string;
  actionType?: string;
  prediction: GovernancePredictionSnapshot;
  truthEvents: GovernanceGroundTruthEvent[];
}

export interface GovernanceFeedbackResult {
  label: GovernanceOutcomeLabel;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  falsePositive: boolean;
  falseNegative: boolean;
  protectedRevenueEstimate: number;
  leakedRevenueEstimate: number;
  reasons: string[];
  recommendedActions: string[];
}

export interface GovernanceThresholdRecommendation {
  metricKey: string;
  currentValue?: number;
  recommendedValue?: number;
  direction: "increase" | "decrease" | "hold";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
  evidenceCount: number;
}

export interface GovernancePerformanceSummary {
  totalCases: number;
  goodBlocks: number;
  badBlocks: number;
  goodApprovals: number;
  badApprovals: number;
  goodExecutions: number;
  badExecutions: number;
  missedRiskCases: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  protectedRevenueEstimate: number;
  leakedRevenueEstimate: number;
}
