import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSafeExecutableAutopilotAction, maxActionsPerRun } from "../ai-autopilot-execution-policy";
import type { AiAutopilotAction } from "../ai-autopilot.types";
import {
  approveAction,
  getAutopilotActionStatus,
  rejectAction,
  resetAutopilotApprovalsForTests,
} from "../ai-autopilot-approval.service";
import {
  resetAutopilotExecutionStateForTests,
  setAutopilotExecutionRecord,
} from "../ai-autopilot-execution-state.service";
import { resetAutopilotMonitoringForTests } from "../ai-autopilot-execution-monitoring.service";

describe("ai-autopilot execution policy", () => {
  it("rejects unknown action types", () => {
    const a = {
      id: "x",
      title: "t",
      description: "d",
      source: "leads",
      impact: "low",
      confidence: 0.5,
      priorityScore: 42,
      why: "test",
      signalStrength: "medium" as const,
      executionMode: "approval_required",
      createdAt: new Date().toISOString(),
      actionType: "lead_timeline_handled" as const,
      targetId: "lead-1",
      targetType: "lead" as const,
      reversible: true,
      domain: "leads" as const,
    } satisfies AiAutopilotAction;
    approveAction(a.id);
    expect(isSafeExecutableAutopilotAction(a).ok).toBe(true);

    const bad: AiAutopilotAction = { ...a, actionType: undefined };
    expect(isSafeExecutableAutopilotAction(bad).ok).toBe(false);
  });

  it("blocks without approval when required", () => {
    resetAutopilotApprovalsForTests();
    const a: AiAutopilotAction = {
      id: "safe-lead_timeline_handled-l1",
      title: "t",
      description: "d",
      source: "leads",
      impact: "low",
      confidence: 0.5,
      priorityScore: 40,
      why: "test",
      signalStrength: "medium",
      executionMode: "approval_required",
      createdAt: new Date().toISOString(),
      actionType: "lead_timeline_handled",
      targetId: "l1",
      targetType: "lead",
      reversible: true,
      domain: "leads",
    };
    expect(isSafeExecutableAutopilotAction(a).ok).toBe(false);
    approveAction(a.id);
    expect(isSafeExecutableAutopilotAction(a).ok).toBe(true);
  });

  it("blocks payments-like domain strings", () => {
    approveAction("p");
    const a: AiAutopilotAction = {
      id: "p",
      title: "t",
      description: "d",
      source: "leads",
      impact: "low",
      confidence: 0.5,
      priorityScore: 40,
      why: "test",
      signalStrength: "medium",
      executionMode: "approval_required",
      createdAt: new Date().toISOString(),
      actionType: "lead_timeline_handled",
      targetId: "l1",
      targetType: "lead",
      reversible: true,
      domain: "internal_payments_helper",
    };
    expect(isSafeExecutableAutopilotAction(a).ok).toBe(false);
  });

  it("maxActionsPerRun is a small positive bound", () => {
    expect(maxActionsPerRun).toBeGreaterThan(0);
    expect(maxActionsPerRun).toBeLessThanOrEqual(20);
  });
});

describe("ai-autopilot approval + execution state", () => {
  beforeEach(() => {
    resetAutopilotApprovalsForTests();
    resetAutopilotExecutionStateForTests();
    resetAutopilotMonitoringForTests();
  });

  it("duplicate execution guard uses execution record", () => {
    const id = "safe-test-1";
    setAutopilotExecutionRecord(id, { executionStatus: "executed" });
    expect(getAutopilotActionStatus(id)).toBe("pending");
    // execution duplicate is separate from approval — tested in integration with prisma mocks
  });

  it("reject then pending", () => {
    rejectAction("r1");
    expect(getAutopilotActionStatus("r1")).toBe("rejected");
  });
});
