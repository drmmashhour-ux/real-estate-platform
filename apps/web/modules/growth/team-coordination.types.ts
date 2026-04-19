/**
 * Team coordination — assignments and status are internal; no workflow execution.
 */

export type CoordinationRole =
  | "admin"
  | "operator"
  | "growth_owner"
  | "broker_ops_owner"
  | "city_owner"
  | "revenue_owner";

export type CoordinationStatus =
  | "unassigned"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "done"
  | "blocked"
  | "skipped";

export type ExecutionApprovalState = "pending_approval" | "approved" | "denied";

export type CoordinationTaskAssignment = {
  id: string;
  taskId: string;
  assignedRole?: CoordinationRole;
  assignedUserId?: string;
  assignedBy?: string;
  assignedAt?: string;
  status: CoordinationStatus;
  dueAt?: string;
  note?: string;
};

export type CoordinationRoleLoad = {
  role: CoordinationRole;
  totalAssigned: number;
  inProgress: number;
  blocked: number;
  done: number;
};

export type CoordinationSummary = {
  totalTasks: number;
  unassignedCount: number;
  assignedCount: number;
  inProgressCount: number;
  doneCount: number;
  blockedCount: number;
  byRole: CoordinationRoleLoad[];
  generatedAt: string;
};
