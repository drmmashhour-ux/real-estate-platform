/** LECIPM Autonomous Growth Engine — bounded autonomy types */

export type GrowthSignalCode =
  | "low_conversion"
  | "high_views_low_booking"
  | "high_demand_low_supply"
  | "inactive_listing"
  | "price_misaligned"
  | "drop_off_point";

export type GrowthActionCode =
  | "adjust_price"
  | "promote_listing"
  | "reorder_listing_rank"
  | "highlight_listing"
  | "suggest_content_improvement"
  | "trigger_notification"
  | "send_user_prompt";

export type GrowthSignalSeverity = "low" | "medium" | "high";

export type GrowthEntityKind =
  | "fsbo_listing"
  | "crm_listing"
  | "bnhub_listing"
  | "city_region"
  | "broker_user"
  | "lead_pipeline";

export type GrowthSignalVm = {
  id: string;
  signal: GrowthSignalCode;
  entityKind: GrowthEntityKind;
  entityId: string | null;
  regionKey?: string | null;
  severity: GrowthSignalSeverity;
  /** Explainable numeric/string context */
  context: Record<string, unknown>;
  detectedAt: string;
};

export type GrowthActionRiskTier = "safe_auto" | "requires_approval" | "blocked";

export type GrowthProposedActionVm = {
  id: string;
  signalRefId: string;
  signal: GrowthSignalCode;
  action: GrowthActionCode;
  riskTier: GrowthActionRiskTier;
  explanation: string;
  payload: Record<string, unknown>;
  entityKind: GrowthEntityKind;
  entityId: string | null;
};

export type GrowthAutonomyMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL";

export type GrowthEngineCycleResult = {
  runBatchId: string;
  autonomyMode: GrowthAutonomyMode;
  signalsDetected: number;
  actionsGenerated: number;
  autoExecuted: number;
  queuedApprovals: number;
  skipped: number;
  errors: string[];
};

export type GrowthEngineDashboardVm = {
  autonomyMode: GrowthAutonomyMode;
  lastRun: GrowthEngineCycleResult | null;
  activeSignals: GrowthSignalVm[];
  recentActions: GrowthEngineActionRowVm[];
  approvalQueue: GrowthApprovalRowVm[];
  performance: GrowthPerformanceSummaryVm;
  learningTop: GrowthLearningRowVm[];
};

export type GrowthEngineActionRowVm = {
  id: string;
  runBatchId: string;
  signalCode: string;
  actionCode: string;
  entityKind: string;
  entityId: string | null;
  autonomyMode: string;
  riskTier: string;
  status: string;
  explanation: string;
  createdAt: string;
  revertedAt: string | null;
};

export type GrowthApprovalRowVm = {
  id: string;
  status: string;
  actionType: string;
  riskTier: string;
  summary: string | null;
  createdAt: string;
};

export type GrowthPerformanceSummaryVm = {
  outcomesMeasured: number;
  avgBookingDeltaApprox: number | null;
  avgEngagementDeltaApprox: number | null;
};

export type GrowthLearningRowVm = {
  signalCode: string;
  actionCode: string;
  attempts: number;
  positiveOutcomes: number;
  rollingScore: number;
};
