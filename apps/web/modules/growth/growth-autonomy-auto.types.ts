/**
 * Controlled low-risk autonomy expansion — bounded, allowlisted internal actions only.
 */

/** Same stages as autonomy rollout — independently gated via FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_ROLLOUT. */
export type GrowthAutonomyAutoLowRiskRolloutStage = "off" | "internal" | "partial" | "full";

/** Narrow allowlisted keys for Phase 1 auto-execution (internal/safe artifacts only). */
export type GrowthAutonomyLowRiskActionKey =
  | "mark_surface_read_internal"
  | "create_internal_review_task"
  | "create_internal_followup_task"
  | "create_internal_content_draft"
  | "queue_internal_followup_reminder"
  | "navigate_operator_panel_hint"
  | "copy_ready_internal_script"
  | "prefill_simulation_context"
  | "prefill_growth_script"
  | "add_internal_priority_tag";

/** Effective presentation / execution tier after policy + rollout + learning resolution. */
export type GrowthAutonomyExecutionClass =
  | "suggest_only"
  | "prefilled_only"
  | "auto_low_risk"
  | "approval_required"
  | "blocked";

/** Partial cohort arms — deterministic per user when rollout is partial (measurement-only split). */
export type GrowthAutonomyAutoCohortBucket = "control" | "suggest_only" | "auto_low_risk";

export type GrowthAutonomyExecutionSafetyCheck = {
  autonomyModeSafeAutopilot: boolean;
  autoRolloutAllowsExecution: boolean;
  autoFeatureFlagOn: boolean;
  autonomyRolloutAllowsSnapshot: boolean;
  actionAllowlisted: boolean;
  policyAllowsAuto: boolean;
  approvalOrBlockFree: boolean;
  killSwitchOff: boolean;
  learningNotSuppressingCategory: boolean;
  confidenceAboveThreshold: boolean;
  learningDataNotSparseForAuto: boolean;
  feedbackNotStronglyNegative: boolean;
  cohortAllowsAutoExecution: boolean;
  enforcementSnapshotUsableForAuto: boolean;
};

export type GrowthAutonomyAutoActionCandidate = {
  catalogEntryId: string;
  lowRiskActionKey: GrowthAutonomyLowRiskActionKey | null;
  reversibility: "reversible_internal" | "none";
};

export type GrowthAutonomyExecutionResult =
  | {
      status: "executed";
      auditId: string;
      catalogEntryId: string;
      lowRiskActionKey: GrowthAutonomyLowRiskActionKey;
      operatorVisibleResult: string;
      undoAvailable: boolean;
      explanation: string;
    }
  | {
      status: "skipped_duplicate";
      reason: string;
      catalogEntryId: string;
    }
  | {
      status: "blocked";
      reason: string;
      catalogEntryId?: string;
    };

export type GrowthAutonomyExecutionMeta = {
  executionClass: GrowthAutonomyExecutionClass;
  resolvedExecutionClass: GrowthAutonomyExecutionClass;
  reversibility: "reversible_internal" | "none";
  lowRiskActionKey?: GrowthAutonomyLowRiskActionKey;
  safety: GrowthAutonomyExecutionSafetyCheck;
  holdReasons: string[];
  downgradeExplanation?: string;
  operatorVisibilityAfterAutoNote: string;
};

/** Snapshot summary for operator UI — cohort + gates (no PII). */
export type GrowthAutonomyAutoLowRiskUiContext = {
  featureFlagOn: boolean;
  rolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  cohortBucket: GrowthAutonomyAutoCohortBucket | null;
  viewerMayReceiveAutoExecution: boolean;
};
