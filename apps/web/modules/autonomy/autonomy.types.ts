/**
 * Governed autonomous brokerage — types only; execution policy enforced in services.
 */

export type AutonomyDomain =
  | "DEAL"
  | "LEAD"
  | "LISTING"
  | "PORTFOLIO"
  | "MESSAGING"
  | "NEGOTIATION"
  | "ORCHESTRATION"
  | "PLAYBOOK"
  | "GREEN"
  | "UNKNOWN";

export type AutonomyActionType =
  | "PRIORITIZE_DEAL"
  | "ROUTE_LEAD"
  | "ASSIGN_TASK"
  | "TAG_LEAD"
  | "TAG_DEAL"
  | "UPDATE_INTERNAL_STATUS_SUGGESTION"
  | "CREATE_FOLLOWUP_TASK"
  | "GENERATE_MESSAGE_DRAFT"
  | "GENERATE_VISIT_PROPOSAL_DRAFT"
  | "GENERATE_NEGOTIATION_BRIEF"
  | "GENERATE_LISTING_OPTIMIZATION_DRAFT"
  | "RANK_LISTINGS"
  | "APPLY_INTERNAL_RANKING_WEIGHT"
  | "ESCALATE_TO_HUMAN";

export type AutonomyMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "APPROVAL_REQUIRED"
  | "FULL_AUTOPILOT_BLOCKED";

export type AutonomyRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type QueueStatus =
  | "QUEUED"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "BLOCKED"
  | "EXPIRED";

export type ApprovalDecision = "APPROVED" | "REJECTED";

export type ExecutionStatus = "SUCCESS" | "FAILED" | "SKIPPED";

export type PolicyScopeType = "GLOBAL" | "DOMAIN" | "BROKER";

export type EscalationTrigger =
  | "HIGH_VALUE_AT_RISK"
  | "BROKER_OVERLOAD"
  | "POLICY_BLOCK"
  | "MISSING_DATA"
  | "EXTERNAL_COMMS_REQUIRED"
  | "LEGAL_SENSITIVE";

export type ApprovalRequirement = {
  actionTypes: AutonomyActionType[];
  reason: string;
};

export type AutonomousActionCandidate = {
  id: string;
  domain: AutonomyDomain;
  actionType: AutonomyActionType;
  riskLevel: AutonomyRiskLevel;
  confidence: number;
  rationale: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
  blockedReasons: string[];
  sourceAgent: string;
  sourceStrategyKey?: string;
  relatedEntityIds: Record<string, string | undefined>;
  policyFlags: string[];
  createdAt: string;
};

export type AutonomousActionDecision = {
  candidateId: string;
  allowed: boolean;
  requiresApproval: boolean;
  blocked: boolean;
  blockedReasons: string[];
  effectiveMode: AutonomyMode;
};

export type AutonomousExecutionResult = {
  ok: boolean;
  adapter: string;
  message: string;
  reversible: boolean;
  details?: Record<string, unknown>;
};

export type BuildCandidatesInput = {
  brokerId?: string | null;
  /** Raw hints from intelligence layers — optional */
  orchestrationHints?: Array<Record<string, unknown>>;
  dealCloserHints?: Array<Record<string, unknown>>;
  offerStrategyHints?: Array<Record<string, unknown>>;
  negotiationHints?: Array<Record<string, unknown>>;
  portfolioHints?: Array<Record<string, unknown>>;
  crmInsights?: Array<Record<string, unknown>>;
  listingIntelligence?: Array<Record<string, unknown>>;
  playbookOutputs?: Array<Record<string, unknown>>;
  reinforcementHints?: Array<Record<string, unknown>>;
  sourceAgent?: string;
  sourceStrategyKey?: string;
  sourceAssignmentId?: string;
  sourceOrchestrationRunId?: string;
};

export type RunAutonomousOperationsInput = BuildCandidatesInput & {
  /** When false, only ASSIST-level recommendations (no queue side effects). */
  dryRun?: boolean;
};

export type AutonomyRunSummary = {
  queuedActions: string[];
  executedActions: string[];
  blockedActions: string[];
  approvalRequiredActions: string[];
  rationale: string;
};

export type RouteResult = {
  queued: boolean;
  status: QueueStatus | "SKIPPED";
  rationale: string;
  actionQueueId?: string;
  blockedReasons?: string[];
};
