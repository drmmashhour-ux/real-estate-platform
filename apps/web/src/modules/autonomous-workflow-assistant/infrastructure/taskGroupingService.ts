import type { AutonomousWorkflowTaskStatus } from "@prisma/client";

export type WorkflowTaskRow = {
  id: string;
  taskType: string;
  priority: string;
  summary: string;
  status: AutonomousWorkflowTaskStatus;
  requiresApproval: boolean;
  payload?: Record<string, unknown> | null | undefined;
  createdAt?: Date;
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasksByPriorityThenAge(tasks: WorkflowTaskRow[]): WorkflowTaskRow[] {
  return tasks.slice().sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export type TaskDisplayGroup = {
  id: string;
  title: string;
  tasks: WorkflowTaskRow[];
};

/**
 * Presentational grouping — keeps the UI calm (related items together without merging legal meaning).
 */
export function groupTasksForDisplay(tasks: WorkflowTaskRow[]): { groups: TaskDisplayGroup[]; standalone: WorkflowTaskRow[] } {
  const sorted = sortTasksByPriorityThenAge(tasks);
  const reviewerDrafts = sorted.filter((t) => t.taskType === "reviewer_comment_draft");
  const rest = sorted.filter((t) => t.taskType !== "reviewer_comment_draft");

  const groups: TaskDisplayGroup[] = [];
  if (reviewerDrafts.length >= 2) {
    groups.push({ id: "reviewer_drafts", title: "Reviewer comment drafts", tasks: reviewerDrafts });
    return { groups, standalone: rest };
  }
  return { groups: [], standalone: sorted };
}

export function filterTasksBlockersOnly(tasks: WorkflowTaskRow[]): WorkflowTaskRow[] {
  return tasks.filter((t) => t.priority === "critical" || (Array.isArray((t.payload as any)?.blockedBy) && ((t.payload as any).blockedBy as unknown[]).length > 0));
}

export function filterApprovalRequired(tasks: WorkflowTaskRow[]): WorkflowTaskRow[] {
  return tasks.filter((t) => t.status === "pending" && t.requiresApproval);
}
