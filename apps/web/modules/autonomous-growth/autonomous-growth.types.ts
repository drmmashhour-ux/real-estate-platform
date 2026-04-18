export type AutonomousDomain =
  | "ADS"
  | "CRO"
  | "RETARGETING"
  | "AB_TEST"
  | "PROFIT"
  | "PORTFOLIO"
  | "MARKETPLACE"
  | "PLATFORM_CORE"
  | "UNIFIED";

export type AutonomousRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "ROLLED_BACK";

export type AutonomousDecisionStage =
  | "OBSERVED"
  | "DECIDED"
  | "PRIORITIZED"
  | "POLICY_BLOCKED"
  | "SIMULATED"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "EXECUTED"
  | "LEARNED";

export type AutonomousSystemSnapshot = {
  observedAt: string;
  domains: AutonomousDomain[];
  recommendationCount: number;
  decisionCount: number;
  executableCount: number;
  blockedCount: number;
  approvalRequiredCount: number;
  warnings: string[];
};

export type AutonomousRunSummary = {
  runId: string;
  status: AutonomousRunStatus;
  snapshot: AutonomousSystemSnapshot;
  notes: string[];
  createdAt: string;
};

export type AutonomousExecutionCandidate = {
  recommendationId: string;
  source: AutonomousDomain;
  actionType: string;
  entityType?: string | null;
  entityId?: string | null;
  trustScore: number;
  confidenceScore: number;
  evidenceScore?: number | null;
  priorityScore: number;
  autonomyMode: string;
  policyAllowed: boolean;
  requiresApproval: boolean;
  requiresSimulation: boolean;
  warnings: string[];
  blockers: string[];
  /** Source-specific payload for audit / learning; not shown as raw JSON in primary UI */
  metadata?: Record<string, unknown>;
};
