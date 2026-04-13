import type { DealRoomStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function updateDealRoomStage(input: {
  dealRoomId: string;
  stage: DealRoomStage;
  actorUserId?: string | null;
}) {
  const prev = await prisma.dealRoom.findUnique({
    where: { id: input.dealRoomId },
    select: { stage: true },
  });
  if (!prev) {
    throw new Error("Deal room not found");
  }
  const room = await prisma.dealRoom.update({
    where: { id: input.dealRoomId },
    data: { stage: input.stage },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.STAGE_CHANGED,
    title: `Stage → ${input.stage.replace(/_/g, " ")}`,
    body: `Previous: ${prev.stage}`,
    metadataJson: { previousStage: prev.stage, newStage: input.stage },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return room;
}
