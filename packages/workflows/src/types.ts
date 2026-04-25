export type WorkflowType =
  | "watchlist_add"
  | "buy_box_create"
  | "appraisal_run"
  | "compare_deals"
  | "saved_search_create"
  | "alert_analysis"
  | "draft_contract";

/** UI / policy hints — all runs still go proposed → approved → executing. */
export const WORKFLOW_REGISTRY: Record<
  string,
  { requiresApproval: boolean; regulated: boolean; label: string }
> = {
  watchlist_add: { requiresApproval: false, regulated: false, label: "Watchlist" },
  compare_deals: { requiresApproval: false, regulated: false, label: "Compare deals" },
  saved_search_create: { requiresApproval: false, regulated: false, label: "Saved search" },

  buy_box_create: { requiresApproval: true, regulated: false, label: "Buy box" },
  appraisal_run: { requiresApproval: true, regulated: true, label: "Appraisal" },
  draft_contract: { requiresApproval: true, regulated: true, label: "Contract draft" },
  alert_analysis: { requiresApproval: true, regulated: false, label: "Alerts" },
};

export type WorkflowStep = {
  type: string;
  label: string;
  input?: Record<string, unknown>;
};

export type WorkflowPlanPayload = {
  type: string;
  title: string;
  description: string;
  requiresApproval: boolean;
  steps: WorkflowStep[];
};
