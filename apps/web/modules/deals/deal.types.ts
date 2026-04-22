export const PIPELINE_STAGES = [
  "SCREENING",
  "PRE_REVIEW",
  "COMMITTEE_REVIEW",
  "CONDITIONAL_APPROVAL",
  "APPROVED",
  "ON_HOLD",
  "DECLINED",
  "EXECUTION",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const DECISION_STATUSES = [
  "PENDING",
  "PROCEED",
  "PROCEED_WITH_CONDITIONS",
  "HOLD",
  "DECLINE",
] as const;

export const COMMITTEE_RECOMMENDATIONS = ["PROCEED", "PROCEED_WITH_CONDITIONS", "HOLD", "DECLINE"] as const;
