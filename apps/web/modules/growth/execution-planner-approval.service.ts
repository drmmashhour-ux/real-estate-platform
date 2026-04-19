/**
 * Internal approval records only — does not execute work or mutate billing.
 */

import type { ExecutionApprovalState } from "@/modules/growth/team-coordination.types";
import {
  recordTaskApprovalDecision,
  recordTaskOpened,
} from "@/modules/growth/execution-planner-monitoring.service";

export type ApprovalRecord = {
  status: ExecutionApprovalState;
  reason?: string;
  decidedAt?: string;
  decidedBy?: string;
};

const approvals = new Map<string, ApprovalRecord>();

export function getApprovalRecord(taskId: string): ApprovalRecord {
  return approvals.get(taskId) ?? { status: "pending_approval" };
}

export function approveExecutionTask(taskId: string, userId?: string): void {
  approvals.set(taskId, {
    status: "approved",
    decidedAt: new Date().toISOString(),
    decidedBy: userId,
  });
  void recordTaskApprovalDecision({ taskId, decision: "approved" });
}

export function denyExecutionTask(taskId: string, reason?: string, userId?: string): void {
  approvals.set(taskId, {
    status: "denied",
    reason,
    decidedAt: new Date().toISOString(),
    decidedBy: userId,
  });
  void recordTaskApprovalDecision({ taskId, decision: "denied", reason });
}

export function listApprovedTaskIds(): string[] {
  return [...approvals.entries()].filter(([, v]) => v.status === "approved").map(([k]) => k);
}

export function listDeniedRecords(): { taskId: string; record: ApprovalRecord }[] {
  return [...approvals.entries()]
    .filter(([, v]) => v.status === "denied")
    .map(([taskId, record]) => ({ taskId, record }));
}

export function listPendingApprovals(candidateTaskIds: string[]): string[] {
  return candidateTaskIds.filter((id) => getApprovalRecord(id).status === "pending_approval");
}

/** Advisory “opened task context” logging — navigation only. */
export function trackTaskSurfaceOpened(taskId: string): void {
  void recordTaskOpened(taskId);
}

/** Clears in-memory approval state — use only from Vitest to avoid cross-test bleed. */
export function resetExecutionPlannerApprovalsForTests(): void {
  approvals.clear();
}
