import { describe, expect, it, beforeEach } from "vitest";

import { evaluateApprovalExecutionFutureExpansionGate } from "../approval-execution-expansion-governance-lock.service";
import { buildApprovalExecutionOutcomeSummary } from "../approval-execution-results.service";
import { APPROVAL_EXECUTION_EXPANSION_LOCKED } from "../approval-execution-results.types";
import {
  createPendingReview,
  prepareGovernanceReviewState,
  submitReviewDecision,
  resetApprovalExecutionReviewForTests,
} from "../approval-execution-review.service";
import { APPROVAL_EXECUTABLE_ACTION_KINDS } from "../approval-execution.types";
import {
  resetGovernanceReviewMonitoringForTests,
  getGovernanceReviewMonitoringSnapshot,
} from "../approval-execution-review-monitoring.service";
import { resetFutureReviewCandidateMonitoringForTests } from "../future-review-candidate-monitoring.service";
import {
  candidateIdForActionType,
  getFutureReviewCandidate,
  resetFutureReviewCandidateStoreForTests,
} from "../future-review-candidate.service";

describe("approval-execution-review.service", () => {
  beforeEach(() => {
    resetApprovalExecutionReviewForTests();
    resetGovernanceReviewMonitoringForTests();
    resetFutureReviewCandidateStoreForTests();
    resetFutureReviewCandidateMonitoringForTests();
  });

  it("reviewed_future_review upserts future review registry candidate (inactive backlog)", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    const { records } = prepareGovernanceReviewState(summary);
    const one = records[0]!;
    const res = submitReviewDecision({
      recordId: one.id,
      decision: "future_review",
      notes: "backlog",
      reviewerId: "reviewer-governance-test",
    });
    expect(res.ok).toBe(true);
    const c = getFutureReviewCandidate(candidateIdForActionType(one.actionType));
    expect(c).toBeDefined();
    expect(c?.currentStatus).toBe("eligible_for_review");
  });

  it("creates pending review rows for every allowlisted action type", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    const state = prepareGovernanceReviewState(summary);
    expect(createPendingReview).toBeDefined();
    expect(state.records.length).toBe(APPROVAL_EXECUTABLE_ACTION_KINDS.length);
    expect(state.records.every((r) => r.status === "pending_review")).toBe(true);
    expect(state.summary.pendingCount).toBe(APPROVAL_EXECUTABLE_ACTION_KINDS.length);
    expect(getGovernanceReviewMonitoringSnapshot().pendingSynced).toBeGreaterThanOrEqual(1);
  });

  it("accepts valid human decisions once", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    const state = prepareGovernanceReviewState(summary);
    const first = state.records[0]!;
    const res = submitReviewDecision({
      recordId: first.id,
      decision: "keep",
      notes: "ok",
      reviewerId: "reviewer-test",
    });
    expect(res.ok).toBe(true);
    const again = submitReviewDecision({
      recordId: first.id,
      decision: "hold",
      notes: "nope",
      reviewerId: "reviewer-test",
    });
    expect(again.ok).toBe(false);
    expect(getGovernanceReviewMonitoringSnapshot().reviewsCompleted).toBe(1);
  });

  it("blocks invalid transition — second review rejected", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    const { records } = prepareGovernanceReviewState(summary);
    const id = records[0]!.id;
    expect(submitReviewDecision({ recordId: id, decision: "hold", notes: "", reviewerId: "u" }).ok).toBe(true);
    expect(submitReviewDecision({ recordId: id, decision: "future_review", notes: "", reviewerId: "u" }).ok).toBe(false);
  });

  it("future expansion gate stays blocked until reviewed_future_review path is complete", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    prepareGovernanceReviewState(summary);
    let gate = evaluateApprovalExecutionFutureExpansionGate(summary);
    expect(gate.blocksFutureScopeWorkflow).toBe(true);
    expect(gate.expansionConsiderationPathCleared).toBe(false);

    // All keep — no future_review row → path not cleared
    for (const kind of APPROVAL_EXECUTABLE_ACTION_KINDS) {
      submitReviewDecision({
        recordId: `rev_${kind}`,
        decision: "keep",
        notes: "",
        reviewerId: "u",
      });
    }
    gate = evaluateApprovalExecutionFutureExpansionGate(buildApprovalExecutionOutcomeSummary());
    expect(gate.expansionConsiderationPathCleared).toBe(false);
    expect(gate.blocksFutureScopeWorkflow).toBe(true);
  });

  it("sets governance rollback flag and gate blocks when rollback reviewed", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    prepareGovernanceReviewState(summary);

    submitReviewDecision({
      recordId: `rev_${APPROVAL_EXECUTABLE_ACTION_KINDS[0]}`,
      decision: "rollback",
      notes: "bad window",
      reviewerId: "u",
    });

    const gate = evaluateApprovalExecutionFutureExpansionGate(buildApprovalExecutionOutcomeSummary());
    expect(gate.governanceRollbackActive).toBe(true);
    expect(gate.blocksFutureScopeWorkflow).toBe(true);
  });

  it("keep / hold alone do not clear expansion consideration path", () => {
    const summary = buildApprovalExecutionOutcomeSummary();
    prepareGovernanceReviewState(summary);
    for (let i = 0; i < APPROVAL_EXECUTABLE_ACTION_KINDS.length; i++) {
      submitReviewDecision({
        recordId: `rev_${APPROVAL_EXECUTABLE_ACTION_KINDS[i]}`,
        decision: i % 2 === 0 ? "keep" : "hold",
        notes: "",
        reviewerId: "u",
      });
    }
    const gate = evaluateApprovalExecutionFutureExpansionGate(buildApprovalExecutionOutcomeSummary());
    expect(gate.expansionConsiderationPathCleared).toBe(false);
  });

  it("clears consideration path only with all rows reviewed and at least one future_review (still no auto code expansion)", () => {
    expect(APPROVAL_EXECUTION_EXPANSION_LOCKED).toBe(true);

    const summary = buildApprovalExecutionOutcomeSummary();
    prepareGovernanceReviewState(summary);

    for (let i = 0; i < APPROVAL_EXECUTABLE_ACTION_KINDS.length; i++) {
      const kind = APPROVAL_EXECUTABLE_ACTION_KINDS[i]!;
      submitReviewDecision({
        recordId: `rev_${kind}`,
        decision: i === 0 ? "future_review" : "keep",
        notes: "",
        reviewerId: "u",
      });
    }

    const gate = evaluateApprovalExecutionFutureExpansionGate(buildApprovalExecutionOutcomeSummary());
    expect(gate.expansionConsiderationPathCleared).toBe(true);
    expect(gate.blocksFutureScopeWorkflow).toBe(false);
  });
});
