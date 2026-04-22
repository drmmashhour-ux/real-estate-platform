/**
 * Auto Policy Proposal Engine v1 — advisory, human-review only; no automatic mutation.
 */

export type PolicyProposalType =
  | "THRESHOLD_ADJUSTMENT"
  | "NEW_RULE"
  | "RULE_ORDER_REVIEW"
  | "REGION_POLICY_REVIEW"
  | "ACTION_POLICY_REVIEW"
  | "ENTITY_POLICY_REVIEW";

export type PolicyProposalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PolicyProposalConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface PolicyProposalEvidence {
  sourceType: "feedback_summary" | "case_cluster" | "drift_alert" | "simulation_result";
  sourceKey: string;
  metric?: string;
  value?: number | string;
  note?: string;
}

export interface PolicyProposalImpactEstimate {
  expectedFalsePositiveRateDelta?: number;
  expectedFalseNegativeRateDelta?: number;
  expectedProtectedRevenueDelta?: number;
  expectedLeakedRevenueDelta?: number;
}

export interface PolicyProposal {
  id: string;
  type: PolicyProposalType;
  title: string;
  description: string;
  priority: PolicyProposalPriority;
  confidence: PolicyProposalConfidence;

  target: {
    metricKey?: string;
    regionCode?: string;
    actionType?: string;
    entityType?: string;
    ruleId?: string;
  };

  recommendation: {
    direction?: "increase" | "decrease" | "add" | "remove" | "reorder" | "review";
    currentValue?: number | string;
    proposedValue?: number | string;
    proposedRuleExpression?: string;
  };

  rationale: string;
  evidence: PolicyProposalEvidence[];
  impactEstimate: PolicyProposalImpactEstimate;
  reviewerNotes?: string[];
}

export interface PolicyProposalInput {
  performanceSummary?: {
    totalCases: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    protectedRevenueEstimate: number;
    leakedRevenueEstimate: number;
  };
  clusters?: Array<{
    clusterKey: string;
    caseCount: number;
    falsePositiveCount: number;
    falseNegativeCount: number;
    leakedRevenueEstimate: number;
    protectedRevenueEstimate: number;
    affectedRuleIds: string[];
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    fingerprint: {
      regionCode?: string;
      actionType?: string;
      entityType?: string;
      policyDecision?: string;
      outcomeLabel?: string;
    };
    recommendedActions?: string[];
  }>;
  driftAlerts?: Array<{
    alertKey: string;
    dimension: "regionCode" | "actionType" | "entityType" | "policyDecision";
    dimensionValue: string;
    metric: "falsePositiveRate" | "falseNegativeRate" | "leakedRevenueEstimate" | "protectedRevenueEstimate";
    baselineValue: number;
    currentValue: number;
    delta: number;
    severity: "INFO" | "WARNING" | "CRITICAL";
    recommendedActions?: string[];
  }>;
  simulationReport?: {
    baseline: {
      configId: string;
      falsePositiveRate: number;
      falseNegativeRate: number;
      protectedRevenue: number;
      leakedRevenue: number;
    };
    scenarios: Array<{
      configId: string;
      falsePositiveRate: number;
      falseNegativeRate: number;
      protectedRevenue: number;
      leakedRevenue: number;
      delta: {
        falsePositiveRate: number;
        falseNegativeRate: number;
        protectedRevenue: number;
        leakedRevenue: number;
      };
    }>;
    bestScenarioId?: string;
  };
}

export interface PolicyProposalReport {
  generatedAt: string;
  proposals: PolicyProposal[];
  summary: {
    totalProposals: number;
    criticalCount: number;
    highCount: number;
    topPriorityTitle?: string;
  };
}
