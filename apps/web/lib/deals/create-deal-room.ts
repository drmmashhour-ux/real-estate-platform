import type { DealPriorityLabel, DealRoomStage, DealParticipantRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";
import { BrokerActionGuard } from "@/lib/compliance/broker-action-guard";

export type CreateDealRoomParticipantInput = {
  userId?: string | null;
  role: DealParticipantRole;
  displayName?: string | null;
  email?: string | null;
};

export async function createDealRoom(input: {
  brokerUserId: string;
  listingId?: string | null;
  leadId?: string | null;
  threadId?: string | null;
  customerUserId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  stage?: DealRoomStage;
  priorityLabel?: DealPriorityLabel;
  summary?: string | null;
  nextAction?: string | null;
  nextFollowUpAt?: Date | null;
  /** Extra participants in addition to the broker row */
  extraParticipants?: CreateDealRoomParticipantInput[];
  actorUserId?: string | null;
}) {
  // Phase 4: Deal Ownership Enforcement & Phase 3: Action Guard
  const guard = await BrokerActionGuard.validateBrokerageAction({
    userId: input.brokerUserId,
    action: "EXECUTE_DEAL",
  });
  if (!guard.allowed) {
    throw new Error(guard.reason || "Broker license validation failed for deal creation.");
  }

  const room = await prisma.dealRoom.create({
    data: {
      brokerUserId: input.brokerUserId,
      listingId: input.listingId ?? undefined,
      leadId: input.leadId ?? undefined,
      threadId: input.threadId ?? undefined,
      customerUserId: input.customerUserId ?? undefined,
      guestName: input.guestName ?? undefined,
      guestEmail: input.guestEmail ?? undefined,
      stage: input.stage ?? "new_interest",
      priorityLabel: input.priorityLabel ?? "medium",
      summary: input.summary ?? undefined,
      nextAction: input.nextAction ?? undefined,
      nextFollowUpAt: input.nextFollowUpAt ?? undefined,
      participants: {
        create: [
          {
            userId: input.brokerUserId,
            role: "broker",
          },
          ...(input.extraParticipants ?? []).map((p) => ({
            userId: p.userId ?? undefined,
            role: p.role,
            displayName: p.displayName ?? undefined,
            email: p.email ?? undefined,
          })),
        ],
      },
    },
  });

  await addDealRoomEvent({
    dealRoomId: room.id,
    eventType: DEAL_ROOM_EVENT.DEAL_ROOM_CREATED,
    title: "Deal room created",
    body: "Centralized workspace opened for this transaction.",
    createdByUserId: input.actorUserId ?? input.brokerUserId,
  });

  return room;
}
