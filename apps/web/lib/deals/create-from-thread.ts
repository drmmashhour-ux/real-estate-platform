import { prisma } from "@/lib/db";
import { createDealRoom } from "./create-deal-room";

export type ThreadSource = "crm" | "platform";

/**
 * Prefer `lead.platformConversationId` when linking from CRM; `threadId` stores Conversation or CrmConversation id.
 */
export async function createDealRoomFromThread(input: {
  threadId: string;
  threadSource: ThreadSource;
  brokerUserId: string;
  actorUserId?: string;
}) {
  const existing = await prisma.dealRoom.findFirst({
    where: { threadId: input.threadId },
    select: { id: true },
  });
  if (existing) {
    return prisma.dealRoom.findUniqueOrThrow({ where: { id: existing.id } });
  }

  if (input.threadSource === "crm") {
    const conv = await prisma.crmConversation.findUnique({
      where: { id: input.threadId },
      include: {
        lead: {
          select: {
            id: true,
            listingId: true,
            name: true,
            email: true,
            userId: true,
            introducedByBrokerId: true,
          },
        },
      },
    });
    if (!conv) {
      throw new Error("CRM conversation not found");
    }
    const lead = conv.lead;
    const brokerUserId = input.brokerUserId;
    const extra = [];
    if (lead?.userId) {
      extra.push({
        userId: lead.userId,
        role: "client" as const,
        displayName: lead.name,
        email: lead.email,
      });
    }
    return createDealRoom({
      brokerUserId,
      listingId: lead?.listingId,
      leadId: lead?.id,
      threadId: input.threadId,
      customerUserId: lead?.userId ?? conv.userId ?? undefined,
      summary: lead ? `Thread — ${lead.name}` : "Thread-linked deal room",
      extraParticipants: extra,
      actorUserId: input.actorUserId ?? input.brokerUserId,
    });
  }

  const platform = await prisma.conversation.findUnique({
    where: { id: input.threadId },
    select: {
      listingId: true,
      leadForPlatformContact: { select: { id: true, introducedByBrokerId: true, name: true, email: true, userId: true } },
    },
  });
  if (!platform) {
    throw new Error("Conversation not found");
  }
  const lead = platform.leadForPlatformContact;
  const brokerUserId = input.brokerUserId;
  const extra = [];
  if (lead?.userId) {
    extra.push({
      userId: lead.userId,
      role: "client" as const,
      displayName: lead.name,
      email: lead.email,
    });
  }

  return createDealRoom({
    brokerUserId,
    listingId: platform.listingId,
    leadId: lead?.id,
    threadId: input.threadId,
    customerUserId: lead?.userId ?? undefined,
    summary: lead ? `Messages — ${lead.name}` : "Message thread deal room",
    extraParticipants: extra,
    actorUserId: input.actorUserId ?? input.brokerUserId,
  });
}
