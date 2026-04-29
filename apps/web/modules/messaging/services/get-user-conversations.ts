import type { ConversationType } from "@/types/messaging-client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getUnreadCountForConversation } from "@/modules/messaging/services/get-unread-count";

export type InboxConversationRow = {
  id: string;
  subject: string | null;
  type: ConversationType;
  contextSummary: string | null;
  contextKind: "listing" | "offer" | "contract" | "appointment" | "client" | null;
  otherParticipantNames: string[];
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isArchived: boolean;
};

export type InboxQueryParams = {
  userId: string;
  search?: string;
  type?: ConversationType | "ALL";
  includeArchived?: boolean;
  take?: number;
};

function displayName(u: { name: string | null; email: string }): string {
  return (u.name?.trim() || u.email || "User").slice(0, 120);
}

function buildContextSummary(conv: {
  type: ConversationType;
  listing: { title: string } | null;
  offer: { id: string } | null;
  contract: { title: string } | null;
  appointment: { title: string; startsAt: Date } | null;
  brokerClient: { fullName: string } | null;
}): { contextKind: InboxConversationRow["contextKind"]; summary: string | null } {
  if (conv.listing) {
    return { contextKind: "listing", summary: conv.listing.title };
  }
  if (conv.offer) {
    return { contextKind: "offer", summary: `Offer ${conv.offer.id.slice(0, 8)}…` };
  }
  if (conv.contract) {
    return { contextKind: "contract", summary: conv.contract.title || "Contract" };
  }
  if (conv.appointment) {
    return {
      contextKind: "appointment",
      summary: `${conv.appointment.title} · ${conv.appointment.startsAt.toLocaleString()}`,
    };
  }
  if (conv.brokerClient) {
    return { contextKind: "client", summary: conv.brokerClient.fullName };
  }
  return { contextKind: null, summary: null };
}

export async function getUserConversationInbox(params: InboxQueryParams): Promise<InboxConversationRow[]> {
  const take = Math.min(params.take ?? 50, 100);
  const q = params.search?.trim();
  const typeFilter = params.type && params.type !== "ALL" ? params.type : undefined;

  const convWhere: Prisma.ConversationWhereInput = {};
  if (typeFilter) convWhere.type = typeFilter;
  if (q) {
    convWhere.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { listing: { title: { contains: q, mode: "insensitive" } } },
      { contract: { title: { contains: q, mode: "insensitive" } } },
      { appointment: { title: { contains: q, mode: "insensitive" } } },
      { brokerClient: { fullName: { contains: q, mode: "insensitive" } } },
      {
        participants: {
          some: {
            user: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  const participantRows = await prisma.conversationParticipant.findMany({
    where: {
      userId: params.userId,
      ...(params.includeArchived ? {} : { isArchived: false }),
      conversation: convWhere,
    },
    take,
    orderBy: { conversation: { updatedAt: "desc" } },
    include: {
      conversation: {
        include: {
          listing: { select: { title: true } },
          offer: { select: { id: true } },
          contract: { select: { title: true } },
          appointment: { select: { title: true, startsAt: true } },
          brokerClient: { select: { fullName: true } },
          participants: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, messageType: true },
          },
        },
      },
    },
  });

  const unreadCounts = await Promise.all(
    participantRows.map((row) => getUnreadCountForConversation(params.userId, row.conversation.id))
  );

  return participantRows.map((row, i) => {
    const c = row.conversation;
    const { contextKind, summary } = buildContextSummary(c);
    const others = c.participants.filter((p) => p.userId !== params.userId);
    const otherNames = others.map((p) => displayName(p.user));
    const last = c.messages[0];
    const preview =
      last?.messageType === "SYSTEM"
        ? last.body.slice(0, 200)
        : last?.body?.replace(/\s+/g, " ").slice(0, 160) ?? null;

    return {
      id: c.id,
      subject: c.subject,
      type: c.type,
      contextSummary: summary,
      contextKind,
      otherParticipantNames: otherNames,
      lastMessagePreview: preview,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? last?.createdAt?.toISOString() ?? null,
      unreadCount: unreadCounts[i] ?? 0,
      isArchived: row.isArchived,
    };
  });
}
