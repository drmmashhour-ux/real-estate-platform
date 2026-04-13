import { prisma } from "@/lib/db";
import { createDealRoom } from "./create-deal-room";

/**
 * One deal room per lead (enforced by @@unique([leadId]) when leadId is set).
 */
export async function createDealRoomFromLead(input: {
  leadId: string;
  brokerUserId: string;
  actorUserId?: string;
}) {
  const existing = await prisma.dealRoom.findFirst({
    where: { leadId: input.leadId },
    select: { id: true },
  });
  if (existing) {
    return prisma.dealRoom.findUniqueOrThrow({
      where: { id: existing.id },
    });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      listingId: true,
      name: true,
      email: true,
      userId: true,
      introducedByBrokerId: true,
    },
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  const brokerUserId = input.brokerUserId;

  const extra: { userId?: string; role: "client" | "buyer"; displayName?: string; email?: string }[] = [];
  if (lead.userId) {
    extra.push({
      userId: lead.userId,
      role: "client",
      displayName: lead.name,
      email: lead.email,
    });
  }

  return createDealRoom({
    brokerUserId,
    listingId: lead.listingId,
    leadId: input.leadId,
    customerUserId: lead.userId ?? undefined,
    guestName: lead.userId ? undefined : lead.name,
    guestEmail: lead.userId ? undefined : lead.email,
    summary: `Lead: ${lead.name}`,
    extraParticipants: extra,
    actorUserId: input.actorUserId ?? input.brokerUserId,
  });
}
