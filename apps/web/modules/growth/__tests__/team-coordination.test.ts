import { describe, expect, it, beforeEach } from "vitest";
import type { ExecutionPlan } from "@/modules/growth/execution-planner.types";
import {
  approveExecutionTask,
  resetExecutionPlannerApprovalsForTests,
} from "@/modules/growth/execution-planner-approval.service";
import { suggestDefaultRole } from "@/modules/growth/team-coordination-role-mapper.service";
import {
  acknowledgeTask,
  assignTaskToRole,
  assignTaskToUser,
  buildCoordinationPlan,
  getCoordinationSummary,
  resetTeamCoordinationForTests,
  updateTaskCoordinationStatus,
  validateStatusTransition,
} from "@/modules/growth/team-coordination.service";

const emptyPlan: ExecutionPlan = {
  todayTasks: [],
  weeklyTasks: [],
  blockedTasks: [],
  insights: [],
  generatedAt: new Date().toISOString(),
};

function baseTask(id: string) {
  return {
    id,
    title: "T",
    description: "",
    category: "broker" as const,
    target: "system:x",
    targetKind: "system" as const,
    priority: "medium" as const,
    effort: "medium" as const,
    source: "weekly_review" as const,
    confidence: "medium" as const,
    requiresApproval: true as const,
    warnings: [],
    rationale: "",
    targetSurface: "growth:weekly_review",
    actionType: "review" as const,
  };
}

describe("role mapping", () => {
  it("maps broker-heavy tasks to broker_ops_owner by default", () => {
    const r = suggestDefaultRole({
      ...baseTask("1"),
      title: "Broker bench",
      category: "broker",
    });
    expect(r.role).toBe("broker_ops_owner");
  });

  it("maps city domination sources to city_owner", () => {
    const r = suggestDefaultRole({
      ...baseTask("2"),
      category: "expansion",
      source: "domination_plan",
      targetKind: "city",
      target: "Montreal",
    });
    expect(r.role).toBe("city_owner");
  });
});

describe("coordination assignment and transitions", () => {
  beforeEach(() => {
    resetExecutionPlannerApprovalsForTests();
    resetTeamCoordinationForTests();
  });

  it("rejects assignment when not approved", () => {
    const r = assignTaskToRole("x", "admin", "actor");
    expect(r.ok).toBe(false);
  });

  it("assigns after approval and enforces valid status moves", () => {
    approveExecutionTask("x", "admin");
    expect(assignTaskToRole("x", "growth_owner", "actor").ok).toBe(true);
    expect(acknowledgeTask("x").ok).toBe(true);
    expect(
      updateTaskCoordinationStatus("x", "in_progress", "actor").ok,
    ).toBe(true);
    expect(
      updateTaskCoordinationStatus("x", "done", "actor").ok,
    ).toBe(true);
    expect(validateStatusTransition("done", "in_progress")).toBe(false);
  });

  it("user assign requires approval", () => {
    approveExecutionTask("y", "a");
    expect(assignTaskToUser("y", "user-2", "a").ok).toBe(true);
  });

  it("buildCoordinationPlan lists task ids from plan", () => {
    const plan: ExecutionPlan = {
      ...emptyPlan,
      todayTasks: [{ ...baseTask("a") }],
      weeklyTasks: [{ ...baseTask("b") }],
    };
    const snap = buildCoordinationPlan(plan);
    expect(snap.taskIds.sort()).toEqual(["a", "b"]);
    expect(getCoordinationSummary().byRole.length).toBe(6);
  });
});
