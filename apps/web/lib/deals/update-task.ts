import type { DealTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function updateDealRoomTask(input: {
  dealRoomId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  status?: DealTaskStatus;
  assignedUserId?: string | null;
  dueAt?: Date | null;
  actorUserId?: string | null;
}) {
  const prev = await prisma.dealRoomTask.findFirst({
    where: { id: input.taskId, dealRoomId: input.dealRoomId },
  });
  if (!prev) {
    throw new Error("Task not found");
  }
  const task = await prisma.dealRoomTask.update({
    where: { id: input.taskId },
    data: {
      title: input.title ?? undefined,
      description: input.description === undefined ? undefined : input.description,
      status: input.status ?? undefined,
      assignedUserId: input.assignedUserId === undefined ? undefined : input.assignedUserId,
      dueAt: input.dueAt === undefined ? undefined : input.dueAt,
    },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.TASK_UPDATED,
    title: `Task updated: ${task.title}`,
    body: input.status && input.status !== prev.status ? `Status ${prev.status} → ${input.status}` : undefined,
    metadataJson: { taskId: task.id, previous: prev.status, next: task.status },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return task;
}
