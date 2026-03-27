import { prisma } from "@/lib/db";

/**
 * Unread = messages from others, created after participant.lastReadAt, not soft-deleted.
 * Own messages never count as unread. If lastReadAt is null, all peer messages are unread.
 */
export async function getUnreadMessageCountForUser(userId: string): Promise<number> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  let total = 0;
  for (const p of parts) {
    const c = await prisma.message.count({
      where: {
        conversationId: p.conversationId,
        senderId: { not: userId },
        deletedAt: null,
        ...(p.lastReadAt == null ? {} : { createdAt: { gt: p.lastReadAt } }),
      },
    });
    total += c;
  }
  return total;
}

export async function getUnreadCountForConversation(
  userId: string,
  conversationId: string
): Promise<number> {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { lastReadAt: true },
  });
  if (!p) return 0;
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      deletedAt: null,
      ...(p.lastReadAt == null ? {} : { createdAt: { gt: p.lastReadAt } }),
    },
  });
}
