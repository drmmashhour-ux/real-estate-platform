import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function updateDealRoomNextAction(input: {
  dealRoomId: string;
  nextAction?: string | null;
  nextFollowUpAt?: Date | null;
  summary?: string | null;
  actorUserId?: string | null;
}) {
  const room = await prisma.dealRoom.update({
    where: { id: input.dealRoomId },
    data: {
      nextAction: input.nextAction === undefined ? undefined : input.nextAction,
      nextFollowUpAt: input.nextFollowUpAt === undefined ? undefined : input.nextFollowUpAt,
      summary: input.summary === undefined ? undefined : input.summary,
    },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.NEXT_ACTION_UPDATED,
    title: "Next action updated",
    body: input.nextAction ?? room.nextAction ?? undefined,
    metadataJson: {
      nextFollowUpAt: input.nextFollowUpAt?.toISOString() ?? null,
    },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return room;
}
