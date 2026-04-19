import { readFileSync } from "fs";
import { dirname, join } from "path";
import { describe, expect, it, beforeEach } from "vitest";
import { fileURLToPath } from "url";

import { APPROVAL_EXECUTION_EXPANSION_LOCKED } from "../approval-execution-results.types";
import {
  addFutureReviewCandidate,
  archiveFutureReviewCandidate,
  candidateIdForActionType,
  getFutureReviewCandidate,
  resetFutureReviewCandidateStoreForTests,
  updateFutureReviewCandidateStatus,
} from "../future-review-candidate.service";
import {
  resetFutureReviewCandidateMonitoringForTests,
  getFutureReviewCandidateMonitoringSnapshot,
} from "../future-review-candidate-monitoring.service";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("future-review-candidate.service", () => {
  beforeEach(() => {
    resetFutureReviewCandidateStoreForTests();
    resetFutureReviewCandidateMonitoringForTests();
  });

  it("creates a proposed candidate", () => {
    const res = addFutureReviewCandidate({
      actionType: "hypotheticalAdjacentTask",
      description: "Draft idea",
      whyAdjacentLowRisk: "Read-only sketch",
      evidenceSummary: { narrative: "None yet" },
      auditHealthSummary: "Not assessed",
      initialStatus: "proposed",
    });
    expect(res.ok).toBe(true);
    expect(getFutureReviewCandidateMonitoringSnapshot().added).toBeGreaterThanOrEqual(1);
    const c = getFutureReviewCandidate(candidateIdForActionType("hypotheticalAdjacentTask"));
    expect(c?.currentStatus).toBe("proposed");
  });

  it("rejects duplicate actionType ids", () => {
    addFutureReviewCandidate({
      actionType: "dupAction",
      description: "a",
      whyAdjacentLowRisk: "b",
      evidenceSummary: { narrative: "c" },
      auditHealthSummary: "d",
    });
    const second = addFutureReviewCandidate({
      actionType: "dupAction",
      description: "a2",
      whyAdjacentLowRisk: "b2",
      evidenceSummary: { narrative: "c2" },
      auditHealthSummary: "d2",
    });
    expect(second.ok).toBe(false);
  });

  it("allows hold / reject / archive transitions and blocks invalid ones", () => {
    addFutureReviewCandidate({
      actionType: "transitionTest",
      description: "x",
      whyAdjacentLowRisk: "y",
      evidenceSummary: { narrative: "z" },
      auditHealthSummary: "ok",
      initialStatus: "eligible_for_review",
    });
    const id = candidateIdForActionType("transitionTest");
    expect(updateFutureReviewCandidateStatus({ id, nextStatus: "held" }).ok).toBe(true);
    expect(updateFutureReviewCandidateStatus({ id, nextStatus: "eligible_for_review" }).ok).toBe(true);
    expect(updateFutureReviewCandidateStatus({ id, nextStatus: "rejected" }).ok).toBe(true);
    expect(updateFutureReviewCandidateStatus({ id, nextStatus: "held" }).ok).toBe(false);
    expect(archiveFutureReviewCandidate({ id }).ok).toBe(true);
  });

  it("archive and reject increment monitoring", () => {
    addFutureReviewCandidate({
      actionType: "one",
      description: "x",
      whyAdjacentLowRisk: "y",
      evidenceSummary: { narrative: "z" },
      auditHealthSummary: "ok",
      initialStatus: "eligible_for_review",
    });
    addFutureReviewCandidate({
      actionType: "two",
      description: "x",
      whyAdjacentLowRisk: "y",
      evidenceSummary: { narrative: "z" },
      auditHealthSummary: "ok",
      initialStatus: "eligible_for_review",
    });
    updateFutureReviewCandidateStatus({
      id: candidateIdForActionType("one"),
      nextStatus: "rejected",
    });
    archiveFutureReviewCandidate({ id: candidateIdForActionType("two") });
    const snap = getFutureReviewCandidateMonitoringSnapshot();
    expect(snap.rejected).toBeGreaterThanOrEqual(1);
    expect(snap.archived).toBeGreaterThanOrEqual(1);
  });

  it("policy: expansion lock stays true independent of registry", () => {
    expect(APPROVAL_EXECUTION_EXPANSION_LOCKED).toBe(true);
  });

  it("activation rule: execution service module does not import registry service", () => {
    const approvalExecutionServicePath = join(__dirname, "..", "approval-execution.service.ts");
    const src = readFileSync(approvalExecutionServicePath, "utf8");
    expect(src.includes("future-review-candidate")).toBe(false);
  });
});
