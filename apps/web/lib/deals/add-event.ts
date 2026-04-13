import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type EventType = string;

export async function addDealRoomEvent(input: {
  dealRoomId: string;
  eventType: EventType;
  title: string;
  body?: string | null;
  metadataJson?: Prisma.InputJsonValue;
  createdByUserId?: string | null;
}) {
  return prisma.dealRoomEvent.create({
    data: {
      dealRoomId: input.dealRoomId,
      eventType: input.eventType,
      title: input.title,
      body: input.body ?? undefined,
      metadataJson: (input.metadataJson ?? {}) as Prisma.InputJsonValue,
      createdByUserId: input.createdByUserId ?? undefined,
    },
  });
}
