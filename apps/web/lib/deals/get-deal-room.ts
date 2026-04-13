import { prisma } from "@/lib/db";

export async function getDealRoomById(id: string) {
  return prisma.dealRoom.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, listingCode: true, price: true } },
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          score: true,
          highIntent: true,
          aiTier: true,
          nextFollowUpAt: true,
          nextBestAction: true,
          lastContactedAt: true,
        },
      },
      participants: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      tasks: { orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }] },
      events: { orderBy: { createdAt: "desc" }, take: 80 },
      documents: { orderBy: { updatedAt: "desc" } },
      payments: { orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function loadThreadPreview(threadId: string | null) {
  if (!threadId) {
    return null;
  }
  const platform = await prisma.conversation.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      lastMessageAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (platform) {
    return {
      source: "platform" as const,
      conversationId: platform.id,
      lastMessageAt: platform.lastMessageAt,
      messages: [...platform.messages].reverse(),
    };
  }
  const crm = await prisma.crmConversation.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, content: true, createdAt: true, sender: true },
      },
    },
  });
  if (crm) {
    return {
      source: "crm" as const,
      conversationId: crm.id,
      lastMessageAt: crm.updatedAt,
      messages: [...crm.messages].reverse().map((m) => ({
        id: m.id,
        body: m.content,
        createdAt: m.createdAt,
      })),
    };
  }
  return null;
}

export async function loadVisitsForDealRoom(input: { leadId: string | null; listingId: string | null }) {
  if (!input.leadId && !input.listingId) {
    return { requests: [] as const, visits: [] as const };
  }

  const or: { leadId?: string; listingId?: string }[] = [];
  if (input.leadId) {
    or.push({ leadId: input.leadId });
  }
  if (input.listingId) {
    or.push({ listingId: input.listingId });
  }

  const requests = await prisma.lecipmVisitRequest.findMany({
    where: { OR: or },
    orderBy: { requestedStart: "desc" },
    take: 20,
    include: {
      listing: { select: { title: true, listingCode: true } },
      visit: true,
    },
  });

  const visits = await prisma.lecipmVisit.findMany({
    where: { OR: or },
    orderBy: { startDateTime: "desc" },
    take: 20,
    include: { listing: { select: { title: true } } },
  });

  return { requests, visits };
}
