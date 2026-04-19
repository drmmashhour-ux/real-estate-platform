/**
 * Lightweight in-memory coordination — resets on deploy/cold start; explicit transitions only.
 */

import type {
  CoordinationRole,
  CoordinationStatus,
  CoordinationSummary,
  CoordinationRoleLoad,
  CoordinationTaskAssignment,
} from "@/modules/growth/team-coordination.types";
import type { ExecutionPlan } from "@/modules/growth/execution-planner.types";
import { getApprovalRecord } from "@/modules/growth/execution-planner-approval.service";
import {
  recordAssignmentEvent,
  recordCoordinationSummaryBuilt,
} from "@/modules/growth/team-coordination-monitoring.service";

const assignments = new Map<string, CoordinationTaskAssignment>();

/** Clears assignments — Vitest only. */
export function resetTeamCoordinationForTests(): void {
  assignments.clear();
}

const VALID_NEXT: Record<CoordinationStatus, CoordinationStatus[]> = {
  unassigned: ["assigned"],
  assigned: ["acknowledged", "skipped", "blocked", "in_progress"],
  acknowledged: ["in_progress", "blocked", "skipped"],
  in_progress: ["done", "blocked", "skipped"],
  done: [],
  blocked: ["assigned", "acknowledged", "in_progress"],
  skipped: [],
};

export function validateStatusTransition(from: CoordinationStatus, to: CoordinationStatus): boolean {
  return VALID_NEXT[from]?.includes(to) ?? false;
}

function cordRowId(taskId: string): string {
  const s = taskId.replace(/[^a-z0-9]+/gi, "-").slice(0, 88);
  return `cord-${s || "task"}`;
}

export function listTaskAssignments(): CoordinationTaskAssignment[] {
  return [...assignments.values()].sort((a, b) => a.taskId.localeCompare(b.taskId));
}

export function getAssignment(taskId: string): CoordinationTaskAssignment | undefined {
  return assignments.get(taskId);
}

export function assignTaskToRole(
  taskId: string,
  role: CoordinationRole,
  actorUserId: string,
): { ok: boolean; error?: string } {
  const ar = getApprovalRecord(taskId);
  if (ar.status !== "approved") {
    return { ok: false, error: "Approve the task before assigning ownership." };
  }
  const row = assignments.get(taskId) ?? {
    id: cordRowId(taskId),
    taskId,
    status: "unassigned" as CoordinationStatus,
  };
  const next: CoordinationTaskAssignment = {
    ...row,
    assignedRole: role,
    assignedBy: actorUserId,
    assignedAt: new Date().toISOString(),
    status: "assigned",
  };
  assignments.set(taskId, next);
  void recordAssignmentEvent({ kind: "assign_role", taskId, role });
  return { ok: true };
}

export function assignTaskToUser(
  taskId: string,
  userId: string,
  actorUserId: string,
): { ok: boolean; error?: string } {
  const ar = getApprovalRecord(taskId);
  if (ar.status !== "approved") {
    return { ok: false, error: "Approve the task before assigning a user." };
  }
  const row = assignments.get(taskId) ?? {
    id: cordRowId(taskId),
    taskId,
    status: "unassigned" as CoordinationStatus,
  };
  const next: CoordinationTaskAssignment = {
    ...row,
    assignedUserId: userId,
    assignedBy: actorUserId,
    assignedAt: new Date().toISOString(),
    status: row.status === "unassigned" ? "assigned" : row.status,
  };
  assignments.set(taskId, next);
  void recordAssignmentEvent({ kind: "assign_user", taskId });
  return { ok: true };
}

export function acknowledgeTask(taskId: string): { ok: boolean; error?: string } {
  const row = assignments.get(taskId);
  if (!row || row.status !== "assigned") {
    return { ok: false, error: "Task must be assigned before acknowledgement." };
  }
  if (!validateStatusTransition(row.status, "acknowledged")) return { ok: false, error: "Invalid transition." };
  assignments.set(taskId, { ...row, status: "acknowledged" });
  void recordAssignmentEvent({ kind: "acknowledge", taskId });
  return { ok: true };
}

export function updateTaskCoordinationStatus(
  taskId: string,
  status: CoordinationStatus,
  actorUserId: string,
  note?: string,
): { ok: boolean; error?: string } {
  const row = assignments.get(taskId);
  if (!row) {
    return { ok: false, error: "Assign the task (role/user) before updating coordination status." };
  }
  if (!validateStatusTransition(row.status, status)) {
    return { ok: false, error: `Cannot move ${row.status} → ${status}` };
  }
  assignments.set(taskId, {
    ...row,
    status,
    note: note ?? row.note,
    assignedBy: actorUserId,
  });
  void recordAssignmentEvent({ kind: "status", taskId, status });
  return { ok: true };
}

export function buildCoordinationPlanSnapshot(): { assignments: CoordinationTaskAssignment[] } {
  return { assignments: listTaskAssignments() };
}

export function buildCoordinationPlan(executionPlan: ExecutionPlan): {
  taskIds: string[];
  assignments: CoordinationTaskAssignment[];
  summary: CoordinationSummary;
} {
  const taskIds = [...executionPlan.todayTasks, ...executionPlan.weeklyTasks].map((t) => t.id);
  return {
    taskIds,
    assignments: listTaskAssignments(),
    summary: getCoordinationSummary(),
  };
}

export function getCoordinationSummary(): CoordinationSummary {
  const list = listTaskAssignments();
  let unassignedCount = 0;
  let assignedCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let blockedCount = 0;

  const roleAgg = new Map<
    CoordinationRole,
    { totalAssigned: number; inProgress: number; blocked: number; done: number }
  >();

  for (const r of list) {
    if (r.status === "unassigned") unassignedCount += 1;
    if (r.status === "assigned") assignedCount += 1;
    if (r.status === "in_progress") inProgressCount += 1;
    if (r.status === "done") doneCount += 1;
    if (r.status === "blocked") blockedCount += 1;

    if (r.assignedRole) {
      const cur = roleAgg.get(r.assignedRole) ?? {
        totalAssigned: 0,
        inProgress: 0,
        blocked: 0,
        done: 0,
      };
      cur.totalAssigned += 1;
      if (r.status === "in_progress") cur.inProgress += 1;
      if (r.status === "blocked") cur.blocked += 1;
      if (r.status === "done") cur.done += 1;
      roleAgg.set(r.assignedRole, cur);
    }
  }

  const byRole: CoordinationRoleLoad[] = (
    ["admin", "operator", "growth_owner", "broker_ops_owner", "city_owner", "revenue_owner"] as CoordinationRole[]
  ).map((role) => {
    const v = roleAgg.get(role);
    return {
      role,
      totalAssigned: v?.totalAssigned ?? 0,
      inProgress: v?.inProgress ?? 0,
      blocked: v?.blocked ?? 0,
      done: v?.done ?? 0,
    };
  });

  const summary: CoordinationSummary = {
    totalTasks: list.length,
    unassignedCount,
    assignedCount,
    inProgressCount,
    doneCount,
    blockedCount,
    byRole,
    generatedAt: new Date().toISOString(),
  };

  void recordCoordinationSummaryBuilt(summary);
  return summary;
}
