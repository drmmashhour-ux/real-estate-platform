export type ExternalAdProvider = "META" | "GOOGLE" | "UNKNOWN";

export type BudgetExecutionAction =
  | "SYNC_CAMPAIGN_BUDGET_INCREASE"
  | "SYNC_CAMPAIGN_BUDGET_DECREASE"
  | "SYNC_CAMPAIGN_PAUSE_PREP"
  | "SYNC_CAMPAIGN_RESUME_PREP";

export type OperatorExecutionMode = "DRY_RUN" | "APPROVED_SYNC" | "SIMULATION_ONLY";

export type BudgetSyncPayload = {
  campaignId: string;
  provider: ExternalAdProvider;
  externalCampaignId?: string | null;
  currentBudget: number;
  proposedBudget: number;
  currency: string;
  reason: string;
  sourceRecommendationId?: string | null;
  /** V2: maps SCALE/PAUSE recommendations to concrete outbound semantics */
  executionAction?: BudgetExecutionAction;
};

export type BudgetGuardrailResult = {
  allowed: boolean;
  blockingReasons: string[];
  warnings: string[];
  cappedBudget?: number | null;
};

export type ExternalSyncResult = {
  success: boolean;
  provider: ExternalAdProvider;
  action: BudgetExecutionAction;
  externalCampaignId?: string | null;
  targetId?: string | null;
  dryRun: boolean;
  message: string;
  warnings?: string[];
  providerResponse?: Record<string, unknown> | null;
  createdAt: string;
};

export type ProviderCampaignMapping = {
  campaignId: string;
  provider: ExternalAdProvider;
  externalCampaignId: string;
  status?: string | null;
  metadata?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Operator V2 — execution brain (priority, conflicts, capped plan; additive)
// ---------------------------------------------------------------------------

export type OperatorScoredRecommendation = {
  id: string;
  source: string;
  actionType: string;
  entityId?: string | null;
  priorityScore: number;
  trustScore: number;
  profitImpact?: number | null;
  confidenceScore?: number | null;
  urgencyScore?: number | null;
  conflictGroup?: string | null;
  reasons: string[];
  warnings: string[];
};

export type OperatorConflictResolution = {
  conflictGroup: string;
  keptRecommendationId: string;
  droppedRecommendationIds: string[];
  reason: string;
};

export type OperatorExecutionPlan = {
  totalRecommendations: number;
  approvedCount: number;
  blockedCount: number;
  ordered: OperatorScoredRecommendation[];
  conflicts: OperatorConflictResolution[];
  notes: string[];
  /** Full ranked list after conflict resolution + guardrails, before batch cap (for UI). */
  rankedFull?: OperatorScoredRecommendation[];
};

/** Heuristic simulation — estimates only, not precision forecasts. */
export type OperatorSimulationEstimate = {
  label: "estimate";
  ctrDeltaApprox: number;
  conversionDeltaApprox: number;
  profitDeltaApprox: number;
  risks: string[];
  notes: string[];
};
