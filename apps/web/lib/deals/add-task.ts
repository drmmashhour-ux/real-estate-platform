import type { DealTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function addDealRoomTask(input: {
  dealRoomId: string;
  title: string;
  description?: string | null;
  status?: DealTaskStatus;
  assignedUserId?: string | null;
  dueAt?: Date | null;
  actorUserId?: string | null;
}) {
  const task = await prisma.dealRoomTask.create({
    data: {
      dealRoomId: input.dealRoomId,
      title: input.title,
      description: input.description ?? undefined,
      status: input.status ?? "todo",
      assignedUserId: input.assignedUserId ?? undefined,
      dueAt: input.dueAt ?? undefined,
    },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.TASK_ADDED,
    title: `Task: ${input.title}`,
    metadataJson: { taskId: task.id },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return task;
}
