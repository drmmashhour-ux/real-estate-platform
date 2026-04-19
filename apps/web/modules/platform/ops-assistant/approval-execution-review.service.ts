/**
 * Governance review orchestration — explicit human decisions only.
 */

import { APPROVAL_EXECUTABLE_ACTION_KINDS } from "./approval-execution.types";
import type { ApprovalExecutionOutcomeSummary } from "./approval-execution-results.types";
import {
  humanDecisionToStatus,
  type ApprovalExecutionHumanDecision,
  type ApprovalExecutionReviewRecord,
  type ApprovalExecutionReviewSummary,
} from "./approval-execution-review.types";
import {
  ensureAllowlistIds,
  getGovernanceRollbackActive,
  getRecord,
  listAllRecords,
  setGovernanceRollbackActive,
  upsertRecord,
} from "./approval-execution-review.store";
import {
  recordGovernanceReviewCompleted,
  recordGovernanceReviewPendingSynced,
  recordGovernanceRollbackMarked,
} from "./approval-execution-review-monitoring.service";
import { upsertFutureReviewCandidateFromGovernanceReview } from "./future-review-candidate.service";

function rid(actionType: string): string {
  return `rev_${actionType}`;
}

function zeroRow(actionType: (typeof APPROVAL_EXECUTABLE_ACTION_KINDS)[number]) {
  return {
    actionType,
    requestCount: 0,
    approvalCount: 0,
    executionCount: 0,
    undoCount: 0,
    failureCount: 0,
  };
}

/**
 * Upserts one record per allowlisted action type from the latest outcome summary.
 * Does not overwrite human-reviewed rows (non-pending).
 */
export function syncPendingReviewsFromOutcomeSummary(summary: ApprovalExecutionOutcomeSummary): void {
  const at = new Date().toISOString();
  for (const kind of APPROVAL_EXECUTABLE_ACTION_KINDS) {
    const id = rid(kind);
    const existing = getRecord(id);
    if (existing && existing.status !== "pending_review") {
      continue;
    }
    const row = summary.byActionType.find((x) => x.actionType === kind) ?? zeroRow(kind);
    const evidence = JSON.stringify({
      window: summary.window.label,
      row,
      overallDecision: summary.finalDecision,
      overallExplanation: summary.explanation,
      totals: summary.totals,
      rates: summary.rates,
    });

    const rec: ApprovalExecutionReviewRecord = {
      id,
      actionType: kind,
      measuredDecision: summary.finalDecision,
      status: "pending_review",
      evidenceSummary: evidence,
      safetySummary: summary.safetyEvaluation,
      usefulnessSummary: summary.usefulnessEvaluation,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    };
    upsertRecord(rec);
  }
  recordGovernanceReviewPendingSynced();
}

export function submitReviewDecision(args: {
  recordId: string;
  decision: ApprovalExecutionHumanDecision;
  notes: string;
  reviewerId: string;
}): { ok: true } | { ok: false; error: string } {
  const cur = getRecord(args.recordId);
  if (!cur) return { ok: false, error: "Unknown review record." };
  if (cur.status !== "pending_review") {
    return { ok: false, error: "This item was already reviewed — create a policy ticket to override." };
  }

  const nextStatus = humanDecisionToStatus(args.decision);
  const at = new Date().toISOString();
  upsertRecord({
    ...cur,
    status: nextStatus,
    reviewedDecision: args.decision,
    reviewedBy: args.reviewerId,
    reviewedAt: at,
    notes: args.notes.trim() || undefined,
    updatedAt: at,
  });

  if (nextStatus === "reviewed_rollback") {
    setGovernanceRollbackActive(true);
    recordGovernanceRollbackMarked();
  }

  if (nextStatus === "reviewed_future_review") {
    const reviewed = getRecord(args.recordId);
    if (reviewed) {
      upsertFutureReviewCandidateFromGovernanceReview({
        record: reviewed,
        reviewerId: args.reviewerId,
      });
    }
  }

  recordGovernanceReviewCompleted(args.decision);
  return { ok: true };
}

export function getReviewRecord(id: string): ApprovalExecutionReviewRecord | undefined {
  return getRecord(id);
}

export function listPendingReviews(): ApprovalExecutionReviewRecord[] {
  return listAllRecords().filter((r) => r.status === "pending_review");
}

export function listReviewedDecisions(): ApprovalExecutionReviewRecord[] {
  return listAllRecords().filter((r) => r.status !== "pending_review");
}

export function buildReviewSummary(summary: ApprovalExecutionOutcomeSummary): ApprovalExecutionReviewSummary {
  const records = listAllRecords();
  const pendingCount = records.filter((r) => r.status === "pending_review").length;
  const reviewedCount = records.length - pendingCount;
  const rollbackActive = getGovernanceRollbackActive();

  const resultsExist =
    summary.totals.requestCount > 0 || summary.finalDecision !== "insufficient_data" || records.length > 0;

  const allSyncedReviewed =
    ensureAllowlistIds().every((id) => {
      const r = getRecord(id);
      return r && r.status !== "pending_review";
    }) && records.length >= APPROVAL_EXECUTABLE_ACTION_KINDS.length;

  const hasFutureReview = records.some((r) => r.status === "reviewed_future_review");

  const expansionConsiderationPathCleared =
    resultsExist && allSyncedReviewed && hasFutureReview && pendingCount === 0;

  return {
    pendingCount,
    reviewedCount,
    governanceRollbackActive: rollbackActive,
    expansionConsiderationPathCleared,
    resultsExist,
  };
}

/** Call after sync so summary reflects latest DB — typically page load. */
export function prepareGovernanceReviewState(summary: ApprovalExecutionOutcomeSummary): {
  summary: ApprovalExecutionReviewSummary;
  records: ApprovalExecutionReviewRecord[];
} {
  syncPendingReviewsFromOutcomeSummary(summary);
  return {
    summary: buildReviewSummary(summary),
    records: listAllRecords(),
  };
}

/** Alias — every measured outcome sync produces/updates pending review rows per allowlisted action type. */
export const createPendingReview = syncPendingReviewsFromOutcomeSummary;

export { resetApprovalExecutionReviewStoreForTests as resetApprovalExecutionReviewForTests } from "./approval-execution-review.store";
