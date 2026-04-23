import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "./deal-audit.service";

const TAG = "[deal.diligence]";

export async function listTasks(dealId: string) {
  return prisma.lecipmPipelineDealDiligenceTask.findMany({
    where: { dealId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getOpenTasks(dealId: string) {
  return prisma.lecipmPipelineDealDiligenceTask.findMany({
    where: { dealId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
  });
}

export async function createTask(
  dealId: string,
  data: {
    title: string;
    description?: string | null;
    category: string;
    priority?: string | null;
    ownerUserId?: string | null;
    dueDate?: Date | null;
    linkedConditionId?: string | null;
  },
  actorUserId: string | null
) {
  const row = await prisma.lecipmPipelineDealDiligenceTask.create({
    data: {
      dealId,
      title: data.title.slice(0, 512),
      description: data.description?.slice(0, 8000) ?? undefined,
      category: data.category.slice(0, 24),
      priority: data.priority?.slice(0, 16) ?? undefined,
      ownerUserId: data.ownerUserId ?? undefined,
      dueDate: data.dueDate ?? undefined,
      linkedConditionId: data.linkedConditionId ?? undefined,
      status: "OPEN",
    },
  });
  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "TASK_CREATED",
    actorUserId,
    summary: `Task: ${row.title}`,
    metadataJson: { taskId: row.id },
  });
  logInfo(TAG, { action: "create", id: row.id });
  return row;
}

export const createDiligenceTask = createTask;

export async function updateTaskStatus(
  taskId: string,
  status: string,
  actorUserId: string | null
) {
  const task = await prisma.lecipmPipelineDealDiligenceTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const row = await prisma.lecipmPipelineDealDiligenceTask.update({
    where: { id: taskId },
    data: {
      status: status.slice(0, 16),
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId: task.dealId,
    eventType: "TASK_STATUS_UPDATED",
    actorUserId,
    summary: `Task ${task.title} → ${status}`,
    metadataJson: { taskId, status },
  });
  logInfo(TAG, { taskId, status });
  return row;
}

export async function setDiligenceTaskStatus(input: { dealId: string; taskId: string; status: string; actorUserId: string | null }) {
  return updateTaskStatus(input.taskId, input.status, input.actorUserId);
}

export async function createTasksFromCondition(conditionId: string, actorUserId: string | null) {
  const cond = await prisma.lecipmPipelineDealCondition.findUnique({ where: { id: conditionId } });
  if (!cond) throw new Error("Condition not found");

  return createTask(
    cond.dealId,
    {
      title: `Satisfy: ${cond.title}`,
      description: cond.description,
      category: "DOCUMENT",
      priority: cond.priority,
      linkedConditionId: cond.id,
    },
    actorUserId
  );
}
