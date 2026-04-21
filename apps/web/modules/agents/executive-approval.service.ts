import { prisma } from "@/lib/db";
import { executiveLog } from "./executive-log";

export async function approveExecutiveTask(params: {
  taskId: string;
  actorUserId: string;
  rationale?: string | null;
}) {
  await prisma.executiveTask.update({
    where: { id: params.taskId },
    data: {
      status: "APPROVED",
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.executiveDecision.create({
    data: {
      taskId: params.taskId,
      entityType: "TASK",
      entityId: params.taskId,
      decisionType: "APPROVE",
      actorUserId: params.actorUserId,
      rationale: params.rationale ?? null,
    },
  });
  executiveLog.approval("approved", { taskId: params.taskId });
}

export async function rejectExecutiveTask(params: {
  taskId: string;
  actorUserId: string;
  rationale?: string | null;
}) {
  await prisma.executiveTask.update({
    where: { id: params.taskId },
    data: { status: "REJECTED", updatedAt: new Date() },
  });
  await prisma.executiveDecision.create({
    data: {
      taskId: params.taskId,
      entityType: "TASK",
      entityId: params.taskId,
      decisionType: "REJECT",
      actorUserId: params.actorUserId,
      rationale: params.rationale ?? null,
    },
  });
  executiveLog.approval("rejected", { taskId: params.taskId });
}
