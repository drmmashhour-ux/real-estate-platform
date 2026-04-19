import { describe, expect, it, beforeEach } from "vitest";
import {
  aiConfidenceToPlanner,
  computeTaskPriority,
  computeTaskPriorityWithRationale,
  effortFromPriority,
} from "@/modules/growth/execution-planner-priority.service";
import {
  applyBlockingWithReasons,
  shouldBlockTaskForGovernance,
  shouldBlockLowConfidenceFlywheel,
} from "@/modules/growth/execution-planner-blocking.service";
import {
  compareTasks,
  dedupeTasks,
  EXECUTION_PLAN_TODAY_MAX,
  EXECUTION_PLAN_WEEKLY_MAX,
} from "@/modules/growth/execution-planner.service";
import type { ExecutionTask } from "@/modules/growth/execution-planner.types";
import {
  approveExecutionTask,
  denyExecutionTask,
  getApprovalRecord,
  listApprovedTaskIds,
  listDeniedRecords,
  resetExecutionPlannerApprovalsForTests,
} from "@/modules/growth/execution-planner-approval.service";

function task(p: Partial<ExecutionTask> & Pick<ExecutionTask, "id" | "title">): ExecutionTask {
  return {
    description: "",
    category: "scaling",
    target: "system:x",
    targetKind: "system",
    priority: "medium",
    effort: "medium",
    source: "weekly_review",
    confidence: "medium",
    requiresApproval: true,
    warnings: [],
    rationale: "test",
    targetSurface: "growth:weekly_review",
    actionType: "review",
    ...p,
  };
}

describe("computeTaskPriorityWithRationale", () => {
  it("returns high for strong allocation + high confidence", () => {
    expect(
      computeTaskPriority({
        allocationScore: 80,
        allocationConfidence: "high",
      }),
    ).toBe("high");
  });

  it("mission control top forces high with stable rationale", () => {
    const r = computeTaskPriorityWithRationale({ missionControlTop: true });
    expect(r.priority).toBe("high");
    expect(r.rationale).toContain("Mission Control");
  });

  it("flywheel low confidence forces low tier", () => {
    const r = computeTaskPriorityWithRationale({ flywheelLowConfidence: true });
    expect(r.priority).toBe("low");
    expect(r.rationale).toContain("Flywheel");
  });

  it("returns low when weekly bundle is low and no strong signals", () => {
    expect(
      computeTaskPriority({
        weeklyBundleConfidence: "low",
        allocationScore: 40,
      }),
    ).toBe("low");
  });

  it("maps AI confidence bands", () => {
    expect(aiConfidenceToPlanner(0.75)).toBe("high");
    expect(aiConfidenceToPlanner(0.55)).toBe("medium");
    expect(aiConfidenceToPlanner(0.4)).toBe("low");
  });

  it("effort tracks priority tier", () => {
    expect(effortFromPriority("high")).toBe("high");
    expect(effortFromPriority("low")).toBe("low");
  });
});

describe("blocking", () => {
  it("allows governance suggestion when governance is blocked", () => {
    const t = task({
      id: "scale-v2-governance",
      title: "Governance hold",
      source: "ai_assist",
    });
    expect(shouldBlockTaskForGovernance(t, { governanceBlocked: true })).toBe(false);
  });

  it("blocks allocation tasks under governance freeze", () => {
    const t = task({ id: "a", title: "Scale winners: X", source: "allocation" });
    expect(shouldBlockTaskForGovernance(t, { governanceBlocked: true })).toBe(true);
  });

  it("splits allowed vs blocked", () => {
    const tasks: ExecutionTask[] = [
      task({ id: "scale-v2-governance", title: "Gov", source: "ai_assist" }),
      task({ id: "x", title: "Other", source: "allocation" }),
    ];
    const { allowed, blocked } = applyBlockingWithReasons(tasks, { governanceBlocked: true });
    expect(blocked.some((b) => b.id === "x")).toBe(true);
    expect(allowed.some((a) => a.id === "scale-v2-governance")).toBe(true);
  });

  it("blocks non-low weekly task when bundle confidence is low", () => {
    const t = task({
      id: "w1",
      title: "Urgent weekly",
      source: "weekly_review",
      priority: "high",
    });
    const { blocked } = applyBlockingWithReasons([t], {
      governanceBlocked: false,
      weeklyConfidence: "low",
    });
    expect(blocked).toHaveLength(1);
    expect(blocked[0].blockReason.length).toBeGreaterThan(0);
  });

  it("blocks low-confidence flywheel when priority is not low", () => {
    const t = task({
      id: "fw1",
      title: "Fly",
      source: "flywheel",
      confidence: "low",
      priority: "medium",
    });
    expect(shouldBlockLowConfidenceFlywheel(t)).toBe(true);
  });
});

describe("deterministic merge and sort", () => {
  it("dedupes same source/category/title key and keeps higher priority", () => {
    const a = task({
      id: "1",
      title: "Same title",
      source: "allocation",
      category: "scaling",
      priority: "medium",
    });
    const b = task({
      id: "2",
      title: "Same title",
      source: "allocation",
      category: "scaling",
      priority: "high",
    });
    const out = dedupeTasks([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("2");
    expect(out[0].priority).toBe("high");
  });

  it("sorts by priority then confidence then title", () => {
    const low = task({
      id: "l",
      title: "Zebra",
      priority: "low",
      confidence: "high",
    });
    const high = task({
      id: "h",
      title: "Alpha",
      priority: "high",
      confidence: "low",
    });
    const sorted = [low, high].sort(compareTasks);
    expect(sorted[0].id).toBe("h");
  });

  it("planner caps today + weekly counts", () => {
    expect(EXECUTION_PLAN_TODAY_MAX).toBe(5);
    expect(EXECUTION_PLAN_WEEKLY_MAX).toBe(9);
  });
});

describe("approval flow", () => {
  beforeEach(() => {
    resetExecutionPlannerApprovalsForTests();
  });

  it("starts pending then approves or denies without side effects beyond store", () => {
    expect(getApprovalRecord("t1").status).toBe("pending_approval");
    approveExecutionTask("t1", "u1");
    expect(getApprovalRecord("t1").status).toBe("approved");
    denyExecutionTask("t2", "no", "u1");
    expect(getApprovalRecord("t2").status).toBe("denied");
    expect(listDeniedRecords().some((d) => d.taskId === "t2")).toBe(true);
    expect(listApprovedTaskIds()).toContain("t1");
  });
});
