/**
 * Unified governance engine v1 — deterministic disposition + explainability + trace.
 */

/** Mirrors PolicySimulationConfig thresholds/overrides — inlined to avoid circular imports with simulation types. */
export type PolicySimulationTuning = {
  thresholds?: {
    combinedRiskMedium?: number;
    combinedRiskHigh?: number;
    anomalySensitivity?: number;
    fraudWeight?: number;
    legalWeight?: number;
  };
  overrides?: {
    forceRequireApproval?: boolean;
    forceBlockHighRisk?: boolean;
  };
};

export type UnifiedGovernanceDisposition =
  | "ALLOW_PREVIEW"
  | "CAUTION_PREVIEW"
  | "REQUIRES_LOCAL_APPROVAL"
  | "BLOCKED_FOR_REGION"
  | "RECOMMEND_ONLY"
  | "DRY_RUN"
  | "REQUIRE_APPROVAL"
  | "AUTO_EXECUTE"
  | "REJECTED";

export type UnifiedGovernanceMode = "preview" | "execution";

export interface UnifiedGovernanceInput {
  mode: UnifiedGovernanceMode;
  actionType?: string;
  entityType?: string;
  regionCode?: string;
  listingId?: string;
  listingDisplayId?: string;
  userId?: string;
  bookingId?: string;
  payoutId?: string;
  listingStatus?: string;
  fraudFlag?: boolean;
  signals?: Array<{
    type: string;
    severity?: "info" | "warning" | "critical";
    metadata?: Record<string, unknown>;
  }>;
  revenueFacts?: {
    grossBookingValue30d?: number;
    refunds30d?: number;
    chargebacks30d?: number;
    payoutVolume30d?: number;
    anomalyScore?: number;
  };
  featureFlags?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
  /**
   * Policy Simulation Sandbox — applied only when `metadata.policySimulationSandbox === true`.
   * Does not affect live preview/execution callers.
   */
  policySimulation?: PolicySimulationTuning;
}

export interface GovernanceRuleTrace {
  step: number;
  ruleId: string;
  matched: boolean;
  outcome?: string;
  reason?: string;
}

export interface GovernanceExplainabilityLine {
  code: string;
  label: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

export interface UnifiedGovernanceResult {
  disposition: UnifiedGovernanceDisposition;
  allowExecution: boolean;
  requiresHumanApproval: boolean;
  blocked: boolean;

  policyDecision?: string;
  approvalBoundary?: {
    liveExecutionBlocked: boolean;
    requiresHumanApprovalHint: boolean;
    reasons: string[];
    notes: string[];
  };

  legalRisk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reasons: string[];
    requiresBlock: boolean;
    requiresApproval: boolean;
  };

  fraudRisk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reasons: string[];
    revenueImpactEstimate: number;
    requiresBlock: boolean;
    requiresApproval: boolean;
  };

  combinedRisk: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };

  explainability: {
    summary: string;
    lines: GovernanceExplainabilityLine[];
    bullets: string[];
  };

  trace: GovernanceRuleTrace[];
}
