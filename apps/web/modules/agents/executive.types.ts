import type { PlatformRole } from "@prisma/client";

/** Normalized agent output — required for orchestration + UI (Part 15). */
export type AgentConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type AgentOutput = {
  agentName: string;
  entityType: string;
  entityId: string;
  confidenceLevel: AgentConfidenceLevel;
  headline: string;
  recommendations: string[];
  blockers: string[];
  risks: string[];
  opportunities: string[];
  requiresEscalation: boolean;
  metadata: Record<string, unknown>;
};

export type ExecutiveTrigger =
  | "DEAL_CREATED"
  | "DEAL_STAGE_CHANGED"
  | "MEMO_GENERATED"
  | "IC_PACK_GENERATED"
  | "COMMITTEE_DECISION_RECORDED"
  | "ESG_SCORE_CHANGED"
  | "EVIDENCE_UPLOADED"
  | "ACQUISITION_STATUS_CHANGED"
  | "LENDER_CONDITION_CHANGED"
  | "COVENANT_RISK_CHANGED"
  | "CLOSING_READINESS_CHANGED"
  | "ASSET_HEALTH_DECLINED"
  | "PORTFOLIO_RUN_REQUESTED"
  | "MANUAL_EXECUTE";

export type OrchestrationRunMode = "MANUAL" | "AUTOMATED" | "SCHEDULED";

export type OrchestrationResult = {
  entityType: string;
  entityId: string;
  orchestratorVersion: string;
  agentsRun: Array<{ agentName: string; runId: string; status: string }>;
  tasksCreated: Array<{ taskId: string; title: string }>;
  escalations: string[];
  conflicts: Array<{ conflictId: string; summary: string }>;
  executiveSummary: string;
  agentOutputs: AgentOutput[];
};

export type ConflictResolutionResult = {
  resolutionType: "RESOLVED" | "ESCALATE";
  preferredRecommendation?: string;
  rationale: string;
  affectedTasks: string[];
};

export type ExecutiveBriefingPayload = {
  date: string;
  topCriticalItems: Array<{ title: string; entityId: string; summary: string }>;
  topApprovalsNeeded: Array<{ taskId: string; title: string }>;
  atRiskAssets: Array<{ assetId: string; reason: string }>;
  blockedDeals: string[];
  financingAlerts: string[];
  complianceAlerts: string[];
  topOpportunities: string[];
  executiveSummary: string;
  policyMode: string;
};

export type AgentContext = {
  userId: string;
  role: PlatformRole;
  entityType: string;
  entityId: string;
};
