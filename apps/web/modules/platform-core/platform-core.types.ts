export type CoreSystemSource =
  | "ADS"
  | "CRO"
  | "RETARGETING"
  | "AB_TEST"
  | "PROFIT"
  | "MARKETPLACE"
  | "OPERATOR"
  | "UNIFIED";

export type CoreEntityType =
  | "CAMPAIGN"
  | "LISTING"
  | "EXPERIMENT"
  | "VARIANT"
  | "MESSAGE"
  | "SURFACE"
  | "UNKNOWN";

export type CoreDecisionStatus =
  | "PENDING"
  | "APPROVED"
  | "DISMISSED"
  | "BLOCKED"
  | "EXECUTED"
  | "FAILED"
  | "ROLLED_BACK"
  | "MONITORING";

export type CoreTaskStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export type CoreDecisionRecord = {
  id: string;
  source: CoreSystemSource;
  entityType: CoreEntityType;
  entityId?: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number;
  evidenceScore?: number | null;
  status: CoreDecisionStatus;
  actionType: string;
  expectedImpact?: string | null;
  warnings?: string[];
  blockers?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CoreTaskRecord = {
  id: string;
  taskType: string;
  source: CoreSystemSource;
  entityType: CoreEntityType;
  entityId?: string | null;
  payload: Record<string, unknown>;
  status: CoreTaskStatus;
  attemptCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CoreAuditEvent = {
  id: string;
  eventType: string;
  source: CoreSystemSource;
  entityType?: CoreEntityType | null;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type CoreApprovalRecord = {
  id: string;
  decisionId: string;
  status: string;
  reviewerUserId?: string | null;
  reviewerNote?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CoreDecisionPriority = {
  priorityScore: number;
  urgency: number;
  impact: number;
  confidence: number;
  reason: string;
};

export type CoreDecisionDependency = {
  decisionId: string;
  dependsOnDecisionId: string;
  type: "BLOCKS" | "REQUIRES" | "RELATED";
};

export type CoreDecisionLifecycle = {
  decisionId: string;
  stateHistory: {
    status: string;
    changedAt: string;
    reason?: string;
  }[];
};

/** Heuristic-only simulation output (not a guarantee of production results). */
export type CoreDecisionSimulationResult = {
  label: "heuristic_estimate";
  expectedCtrDelta: number;
  expectedConversionDelta: number;
  expectedProfitDelta: number;
  confidence: number;
  risks: string[];
  /** Non-predictive labels for operators (e.g. “estimate only”). */
  notes?: string[];
};
