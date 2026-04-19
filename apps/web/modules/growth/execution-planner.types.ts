/**
 * Approval-based execution planner — proposals only; no automation or outbound sends.
 */

export type ExecutionTaskCategory =
  | "sourcing"
  | "conversion"
  | "expansion"
  | "scaling"
  | "broker"
  | "bnhub"
  | "revenue"
  | "ops";

export type ExecutionTaskPriority = "high" | "medium" | "low";

export type ExecutionTaskEffort = "low" | "medium" | "high";

export type ExecutionTaskSource =
  | "allocation"
  | "weekly_review"
  | "ai_assist"
  | "domination_plan"
  | "flywheel"
  | "mission_control";

/** What the task anchor refers to — for routing + audit clarity. */
export type ExecutionTaskTargetKind = "city" | "system" | "panel" | "lead" | "broker" | "market";

export type PlannerConfidence = "low" | "medium" | "high";

export type ExecutionTaskActionType =
  | "navigate"
  | "inspect"
  | "review"
  | "draft"
  | "compare"
  | "assign";

/**
 * Stable navigation token — e.g. mission_control:fusion, growth:capital_allocation, panel:crm.
 * Resolved client-side via growth-task-navigation helpers (query params only).
 */
export type ExecutionTargetSurface = string;

export type ExecutionTask = {
  id: string;
  title: string;
  description: string;
  category: ExecutionTaskCategory;
  /** Human-readable anchor (city name, system:*, etc.). */
  target: string;
  targetKind: ExecutionTaskTargetKind;
  priority: ExecutionTaskPriority;
  effort: ExecutionTaskEffort;
  source: ExecutionTaskSource;
  confidence: PlannerConfidence;
  /** Always true — execution happens outside this system after human approval. */
  requiresApproval: true;
  warnings: string[];
  /** Deterministic explanation of priority tier + inputs used. */
  rationale: string;
  targetSurface: ExecutionTargetSurface;
  actionType: ExecutionTaskActionType;
};

export type BlockedExecutionTask = ExecutionTask & {
  blockReason: string;
  unblockSuggestion: string;
};

export type ExecutionPlan = {
  todayTasks: ExecutionTask[];
  weeklyTasks: ExecutionTask[];
  blockedTasks: BlockedExecutionTask[];
  insights: string[];
  generatedAt: string;
};
