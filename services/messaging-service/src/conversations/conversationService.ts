import { prisma } from "../db.js";

const conversationListInclude = {
  participants: true,
  messages: {
    take: 1,
    orderBy: { createdAt: "desc" as const },
    include: { attachments: true },
  },
};

/** List conversations for a user with last message and unread count. */
export async function listConversations(
  userId: string,
  limit: number,
  offset: number
) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: true,
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { attachments: true },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
    take: limit,
    skip: offset,
  });

  const total = await prisma.conversationParticipant.count({
    where: { userId },
  });

  const data = await Promise.all(
    participants.map(async (p) => {
      const conv = p.conversation;
      const unreadCount = await getUnreadCount(conv.id, userId);
      const lastMessage = conv.messages[0] ?? null;
      return {
        id: conv.id,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        participants: conv.participants.map((x) => ({
          userId: x.userId,
          lastReadAt: x.lastReadAt?.toISOString() ?? null,
          joinedAt: x.joinedAt.toISOString(),
        })),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt.toISOString(),
              attachments: lastMessage.attachments.map((a) => ({
                id: a.id,
                url: a.url,
                type: a.type,
                filename: a.filename,
              })),
            }
          : null,
        unreadCount,
      };
    })
  );

  return {
    data,
    pagination: { limit, offset, total },
  };
}

/** Create a conversation with the current user + other participant(s). */
export async function createConversation(creatorUserId: string, participantUserIds: string[]) {
  const allUserIds = [creatorUserId, ...participantUserIds.filter((id) => id !== creatorUserId)];
  const unique = [...new Set(allUserIds)];
  if (unique.length < 2) throw new Error("At least two distinct users required");

  const existing = await findConversationBetween(unique);
  if (existing) {
    const unreadCount = await getUnreadCount(existing.id, creatorUserId);
    const lastMessage = existing.messages[0] ?? null;
    return {
      id: existing.id,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
      participants: existing.participants.map((p) => ({
        userId: p.userId,
        lastReadAt: p.lastReadAt?.toISOString() ?? null,
        joinedAt: p.joinedAt.toISOString(),
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
            attachments: lastMessage.attachments.map((a) => ({ id: a.id, url: a.url, type: a.type, filename: a.filename })),
          }
        : null,
      unreadCount,
    };
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: unique.map((userId) => ({ userId })),
      },
    },
    include: { participants: true },
  });

  return {
    id: conversation.id,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    participants: conversation.participants.map((p) => ({
      userId: p.userId,
      lastReadAt: p.lastReadAt?.toISOString() ?? null,
      joinedAt: p.joinedAt.toISOString(),
    })),
    lastMessage: null,
    unreadCount: 0,
  };
}

async function findConversationBetween(userIds: string[]): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: { userId: string; lastReadAt: Date | null; joinedAt: Date }[];
  messages: { id: string; senderId: string; body: string; createdAt: Date; attachments: { id: string; url: string; type: string; filename: string | null }[] }[];
} | null> {
  const sorted = [...new Set(userIds)].sort();
  const convs = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: { in: userIds } } },
    },
    include: {
      participants: true,
      messages: { take: 1, orderBy: { createdAt: "desc" }, include: { attachments: true } },
    },
  });
  for (const c of convs) {
    const participantIds = c.participants.map((p) => p.userId).sort();
    if (participantIds.length === sorted.length && participantIds.every((id, i) => id === sorted[i]))
      return c;
  }
  return null;
}

/** Get one conversation by id; ensure user is a participant. */
export async function getConversationById(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: {
          participants: true,
          messages: { take: 0 },
        },
      },
    },
  });
  if (!participant) return null;

  const conv = participant.conversation;
  const unreadCount = await getUnreadCount(conv.id, userId);

  return {
    id: conv.id,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
    participants: conv.participants.map((p) => ({
      userId: p.userId,
      lastReadAt: p.lastReadAt?.toISOString() ?? null,
      joinedAt: p.joinedAt.toISOString(),
    })),
    unreadCount,
  };
}

/** Unread count for a user in a conversation (messages from others after lastReadAt). */
export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return 0;

  const after = participant.lastReadAt ?? new Date(0);
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      createdAt: { gt: after },
    },
  });
}

/** Mark conversation as read for user (set lastReadAt to now). */
export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
