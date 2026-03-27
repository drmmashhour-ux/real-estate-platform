import { prisma } from "@/lib/db";
import type { Prisma, WorkflowAutomationEventStatus } from "@prisma/client";
import type { AutonomousWorkflowTaskStatus } from "@prisma/client";

export async function createWorkflowTask(args: {
  documentId?: string | null;
  propertyId?: string | null;
  taskType: string;
  priority: string;
  targetUserRole: string;
  summary: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
}) {
  return prisma.autonomousWorkflowTask.create({
    data: {
      documentId: args.documentId ?? null,
      propertyId: args.propertyId ?? null,
      taskType: args.taskType,
      priority: args.priority,
      targetUserRole: args.targetUserRole,
      summary: args.summary,
      payload: args.payload as Prisma.InputJsonValue,
      requiresApproval: args.requiresApproval,
      status: "pending",
    },
  });
}

export async function listWorkflowTasks(filters?: {
  documentId?: string;
  status?: AutonomousWorkflowTaskStatus;
  statusIn?: AutonomousWorkflowTaskStatus[];
}) {
  return prisma.autonomousWorkflowTask.findMany({
    where: {
      ...(filters?.documentId ? { documentId: filters.documentId } : {}),
      ...(filters?.statusIn?.length
        ? { status: { in: filters.statusIn } }
        : filters?.status
          ? { status: filters.status }
          : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
}

export async function bulkCompleteTasks(ids: string[]) {
  if (!ids.length) return { count: 0 };
  return prisma.autonomousWorkflowTask.updateMany({
    where: { id: { in: ids } },
    data: { status: "completed" },
  });
}

/** Latest creation time for a task with the same payload fingerprint (noise control). */
export async function findLatestCreatedAtForFingerprint(documentId: string, fingerprint: string) {
  const rows = await prisma.autonomousWorkflowTask.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: { createdAt: true, payload: true },
  });
  const hit = rows.find((r) => (r.payload as { fingerprint?: string })?.fingerprint === fingerprint);
  return hit?.createdAt ?? null;
}

export async function updateTaskStatus(id: string, status: AutonomousWorkflowTaskStatus) {
  return prisma.autonomousWorkflowTask.update({ where: { id }, data: { status } });
}

export async function recordWorkflowAutomationEvent(args: {
  triggerType: string;
  entityType: string;
  entityId: string;
  actionType: string;
  status: WorkflowAutomationEventStatus;
  payload?: Record<string, unknown>;
}) {
  return prisma.workflowAutomationEvent.create({
    data: {
      triggerType: args.triggerType,
      entityType: args.entityType,
      entityId: args.entityId,
      actionType: args.actionType,
      status: args.status,
      payload: (args.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listWorkflowAutomationEvents(filters: { entityType: string; entityId: string; take?: number }) {
  return prisma.workflowAutomationEvent.findMany({
    where: { entityType: filters.entityType, entityId: filters.entityId },
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 40,
  });
}
