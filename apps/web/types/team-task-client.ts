/** Mirrors Prisma `TeamTask` enums — client bundles must not depend on `@prisma/client`. */
export type TeamTaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type TeamTaskPriority = "LOW" | "NORMAL" | "HIGH";

export type TeamTaskView = {
  id: string;
  title: string;
  description?: string | null;
  status: TeamTaskStatus;
  priority: TeamTaskPriority;
  assigneeUserId: string;
  createdByUserId: string;
  dueAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  impactScore?: number | null;
  resultNotes?: string | null;
  metadata?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
