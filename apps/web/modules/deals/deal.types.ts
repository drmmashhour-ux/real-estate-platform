/** Pipeline lifecycle — deterministic workflow labels */
export type PipelineStage =
  | "SOURCED"
  | "SCREENING"
  | "PRELIMINARY_REVIEW"
  | "IC_PREP"
  | "IC_REVIEW"
  | "CONDITIONAL_APPROVAL"
  | "APPROVED"
  | "EXECUTION"
  | "CLOSED"
  | "DECLINED"
  | "ON_HOLD";

export type DealLifecycleStatus = "ACTIVE" | "ON_HOLD" | "APPROVED" | "DECLINED" | "CLOSED";

export type CommitteeRecommendation = "PROCEED" | "PROCEED_WITH_CONDITIONS" | "HOLD" | "DECLINE";

export type DecisionStatus = "PENDING" | "PROCEED" | "PROCEED_WITH_CONDITIONS" | "HOLD" | "DECLINE";

export type ConditionCategory = "ESG" | "LEGAL" | "FINANCIAL" | "DOCUMENTATION" | "TECHNICAL" | "COMMITTEE";

export type ConditionStatus = "OPEN" | "IN_PROGRESS" | "SATISFIED" | "WAIVED" | "FAILED";

export type DiligenceCategory = "ESG" | "LEGAL" | "FINANCIAL" | "TECHNICAL" | "MARKET" | "OPERATIONS";

export type DiligenceStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED";

export type FollowUpType =
  | "APPROVAL_NEXT_STEP"
  | "CONDITION_CHECK"
  | "DOCUMENT_REQUEST"
  | "INVESTOR_UPDATE"
  | "EXECUTION_TASK";

export type AuditEventType =
  | "CREATED"
  | "STAGE_CHANGED"
  | "SUBMITTED_TO_COMMITTEE"
  | "DECISION_RECORDED"
  | "CONDITION_ADDED"
  | "CONDITION_STATUS_CHANGED"
  | "TASK_COMPLETED"
  | "FOLLOWUP_CREATED"
  | "ARTIFACTS_REFRESHED";
