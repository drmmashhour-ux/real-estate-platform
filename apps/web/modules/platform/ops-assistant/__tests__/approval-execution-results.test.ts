import { describe, expect, it, beforeEach } from "vitest";

import { decideApprovalExecutionOutcome } from "../approval-execution-decision.service";
import { buildApprovalExecutionOutcomeSummary } from "../approval-execution-results.service";
import {
  resetApprovalResultsMonitoringForTests,
  getApprovalResultsMonitoringSnapshot,
} from "../approval-execution-results-monitoring.service";
import { evaluateApprovalSafety } from "../approval-execution-safety.service";
import { evaluateApprovalUsefulness } from "../approval-execution-usefulness.service";
import {
  resetApprovalExecutionForTests,
} from "../approval-execution.service";
import { APPROVAL_EXECUTION_EXPANSION_LOCKED } from "../approval-execution-results.types";

describe("approval-execution-results", () => {
  beforeEach(() => {
    resetApprovalExecutionForTests();
    resetApprovalResultsMonitoringForTests();
  });

  it("sparse store => insufficient_data", () => {
    const s = buildApprovalExecutionOutcomeSummary();
    expect(s.finalDecision).toBe("insufficient_data");
    expect(s.totals.requestCount).toBe(0);
  });

  it("unsafe safety => rollback_candidate", () => {
    const r = evaluateApprovalSafety({
      totalRequests: 10,
      executionCount: 8,
      undoCount: 4,
      failureCount: 0,
      blockedBySafetyCount: 0,
      undoRate: 0.5,
      failureRate: 0,
      auditTrailGapRatio: 0,
      allowlistViolation: true,
    });
    expect(r.score).toBe("unsafe");
    const d = decideApprovalExecutionOutcome({
      insufficientData: false,
      safety: r.score,
      usefulness: "good",
      undoRate: 0.5,
      failureRate: 0,
      executionCount: 8,
    });
    expect(d.decision).toBe("rollback_candidate");
  });

  it("high undo => rollback_candidate", () => {
    const d = decideApprovalExecutionOutcome({
      insufficientData: false,
      safety: "safe",
      usefulness: "good",
      undoRate: 0.5,
      failureRate: 0,
      executionCount: 5,
    });
    expect(d.decision).toBe("rollback_candidate");
  });

  it("safe + strong usefulness + low undo => eligible_for_future_review", () => {
    const d = decideApprovalExecutionOutcome({
      insufficientData: false,
      safety: "safe",
      usefulness: "strong",
      undoRate: 0.05,
      failureRate: 0.05,
      executionCount: 5,
    });
    expect(d.decision).toBe("eligible_for_future_review");
  });

  it("expansion lock constant stays true (policy)", () => {
    expect(APPROVAL_EXECUTION_EXPANSION_LOCKED).toBe(true);
  });

  it("decision explanation is deterministic for same inputs", () => {
    const a = decideApprovalExecutionOutcome({
      insufficientData: true,
      safety: "safe",
      usefulness: "strong",
      undoRate: 0,
      failureRate: 0,
      executionCount: 0,
    });
    const b = decideApprovalExecutionOutcome({
      insufficientData: true,
      safety: "safe",
      usefulness: "strong",
      undoRate: 0,
      failureRate: 0,
      executionCount: 0,
    });
    expect(a.explanation).toBe(b.explanation);
  });

  it("records monitoring when summary is built", () => {
    buildApprovalExecutionOutcomeSummary();
    expect(getApprovalResultsMonitoringSnapshot().summariesComputed).toBeGreaterThanOrEqual(1);
  });

  it("usefulness insufficient when no executions", () => {
    const u = evaluateApprovalUsefulness({
      totalRequests: 8,
      executionCount: 0,
      executedSuccessCount: 0,
      failureCount: 0,
      undoCount: 0,
      approvalCount: 0,
      executionSuccessRate: 0,
      undoRate: 0,
    });
    expect(u.score).toBe("insufficient_data");
  });
});
