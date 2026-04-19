/**
 * Manual governance decisions on measured approval execution — humans only; never auto-expands scope.
 */

import type { ApprovalExecutableActionKind } from "./approval-execution.types";
import type { ApprovalExecutionDecision } from "./approval-execution-results.types";

/** Operator button choice → persisted status */
export type ApprovalExecutionHumanDecision = "keep" | "hold" | "rollback" | "future_review";

/** @alias ApprovalExecutionHumanDecision — explicit governance choice */
export type ApprovalExecutionReviewDecision = ApprovalExecutionHumanDecision;

export type ApprovalExecutionReviewStatus =
  | "pending_review"
  | "reviewed_keep"
  | "reviewed_hold"
  | "reviewed_rollback"
  | "reviewed_future_review";

export type ApprovalExecutionReviewRecord = {
  id: string;
  actionType: ApprovalExecutableActionKind;
  /** System-measured label at last sync (same overall outcome for context). */
  measuredDecision: ApprovalExecutionDecision;
  status: ApprovalExecutionReviewStatus;
  /** Human button choice once reviewed; absent while pending_review. */
  reviewedDecision?: ApprovalExecutionHumanDecision;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  evidenceSummary: string;
  safetySummary: string;
  usefulnessSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalExecutionReviewSummary = {
  pendingCount: number;
  reviewedCount: number;
  /** True if any row was explicitly marked rollback by a human. */
  governanceRollbackActive: boolean;
  /** True only when evidence exists, every synced row is reviewed, and at least one row is future_review — still does NOT enable new execution. */
  expansionConsiderationPathCleared: boolean;
  /** Results bundle present (request volume or summary computed). */
  resultsExist: boolean;
};

export const GOVERNANCE_EXPANSION_GATE_MESSAGE =
  "Future scope review locked until manual governance review is complete.";

export const GOVERNANCE_NO_AUTO_EXPANSION_MESSAGE =
  "No automatic promotion from eligible_for_future_review or any review label — engineering policy only.";

export function humanDecisionToStatus(d: ApprovalExecutionHumanDecision): ApprovalExecutionReviewStatus {
  switch (d) {
    case "keep":
      return "reviewed_keep";
    case "hold":
      return "reviewed_hold";
    case "rollback":
      return "reviewed_rollback";
    case "future_review":
      return "reviewed_future_review";
    default:
      return "pending_review";
  }
}
