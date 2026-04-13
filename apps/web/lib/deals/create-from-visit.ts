import { prisma } from "@/lib/db";
import { addDealRoomEvent } from "./add-event";
import { createDealRoom } from "./create-deal-room";
import { DEAL_ROOM_EVENT } from "./constants";

export async function createDealRoomFromVisitRequest(input: {
  visitRequestId: string;
  brokerUserId: string;
  actorUserId?: string;
}) {
  const vr = await prisma.lecipmVisitRequest.findUnique({
    where: { id: input.visitRequestId },
    select: {
      brokerUserId: true,
      listingId: true,
      leadId: true,
      threadId: true,
      customerUserId: true,
      guestName: true,
      guestEmail: true,
    },
  });
  if (!vr) {
    throw new Error("Visit request not found");
  }
  if (vr.brokerUserId !== input.brokerUserId) {
    throw new Error("Visit request belongs to another broker");
  }

  const existing = await prisma.dealRoom.findFirst({
    where: { leadId: vr.leadId },
    select: { id: true },
  });
  if (existing) {
    const withThread = await prisma.dealRoom.update({
      where: { id: existing.id },
      data: {
        threadId: vr.threadId ?? undefined,
        listingId: vr.listingId,
        stage: "visit_scheduled",
      },
    });
    await addDealRoomEvent({
      dealRoomId: withThread.id,
      eventType: DEAL_ROOM_EVENT.VISIT_NOTE,
      title: "Visit request linked",
      body: "Existing deal room updated from visit scheduling.",
      createdByUserId: input.actorUserId ?? input.brokerUserId,
    });
    return withThread;
  }

  return createDealRoom({
    brokerUserId: vr.brokerUserId,
    listingId: vr.listingId,
    leadId: vr.leadId,
    threadId: vr.threadId ?? undefined,
    customerUserId: vr.customerUserId ?? undefined,
    guestName: vr.guestName,
    guestEmail: vr.guestEmail,
    stage: "visit_scheduled",
    summary: "Opened from visit request",
    actorUserId: input.actorUserId ?? input.brokerUserId,
  });
}
