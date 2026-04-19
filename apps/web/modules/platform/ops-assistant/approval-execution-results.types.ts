/**
 * Evidence-only measurement for approval execution — no autonomy expansion from this module.
 */

import type { ApprovalExecutableActionKind } from "./approval-execution.types";

export type ApprovalExecutionDecision =
  | "keep_current_scope"
  | "hold"
  | "rollback_candidate"
  | "eligible_for_future_review"
  | "insufficient_data";

export type ApprovalExecutionSafetyScore = "safe" | "caution" | "unsafe";

export type ApprovalExecutionUsefulnessScore = "strong" | "good" | "weak" | "poor" | "insufficient_data";

export type ApprovalExecutionMeasurementWindow = {
  /** Human label, e.g. "all stored requests" */
  label: string;
  sinceIso?: string;
  untilIso?: string;
};

/** Per–action-type rollups for evidence review. */
export type ApprovalExecutionOutcomeByAction = {
  actionType: ApprovalExecutableActionKind;
  requestCount: number;
  approvalCount: number;
  executionCount: number;
  undoCount: number;
  failureCount: number;
};

/** Aggregate outcome used by the results panel and docs — conservative, explainable. */
export type ApprovalExecutionOutcomeSummary = {
  window: ApprovalExecutionMeasurementWindow;
  totals: {
    requestCount: number;
    approvalCount: number;
    denialCount: number;
    executionCount: number;
    undoCount: number;
    failureCount: number;
    blockedBySafetyCount: number;
  };
  rates: {
    /** Approvals / (approvals + denials) among resolved intake, or 0 */
    approvalRate: number;
    /** executed / (executed + failed) */
    executionSuccessRate: number;
    /** undos / max(1, executed) */
    undoRate: number;
    /** failed / max(1, executed + failed) */
    failureRate: number;
  };
  byActionType: ApprovalExecutionOutcomeByAction[];
  operatorFeedbackSummary: string;
  safetyEvaluation: ApprovalExecutionSafetyScore;
  usefulnessEvaluation: ApprovalExecutionUsefulnessScore;
  finalDecision: ApprovalExecutionDecision;
  explanation: string;
};

/** Explicit policy: no new executable kinds until humans review outcomes. */
export const APPROVAL_EXECUTION_EXPANSION_LOCKED = true as const;

export const APPROVAL_EXECUTION_EXPANSION_LOCK_MESSAGE =
  "Further execution expansion is locked pending results review.";
