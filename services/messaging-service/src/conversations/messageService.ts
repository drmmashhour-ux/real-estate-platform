import { prisma } from "../db.js";
import type { CreateMessageBody } from "../validation/schemas.js";
import { emitNewMessage } from "../realtime/events.js";

/** Ensure user is in conversation; return conversation or null. */
export async function ensureParticipant(conversationId: string, userId: string): Promise<boolean> {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!p;
}

/** List messages in a conversation (paginated, optional before cursor). */
export async function listMessages(
  conversationId: string,
  userId: string,
  limit: number,
  before?: string
) {
  const isParticipant = await ensureParticipant(conversationId, userId);
  if (!isParticipant) return null;

  const where: { conversationId: string; createdAt?: { lt: Date } } = { conversationId };
  if (before) where.createdAt = { lt: new Date(before) };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: { attachments: true },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return {
    data: items.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      attachments: m.attachments.map((a) => ({
        id: a.id,
        url: a.url,
        type: a.type,
        filename: a.filename,
      })),
    })),
    hasMore,
    nextBefore: hasMore ? items[items.length - 1].createdAt.toISOString() : null,
  };
}

/** Send a message; optionally with attachments. Updates conversation.updatedAt. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: CreateMessageBody
) {
  const isParticipant = await ensureParticipant(conversationId, senderId);
  if (!isParticipant) return null;

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId,
        body: body.body,
        attachments:
          body.attachments && body.attachments.length > 0
            ? {
                create: body.attachments.map((a) => ({
                  url: a.url,
                  type: a.type,
                  filename: a.filename,
                })),
              }
            : undefined,
      },
      include: { attachments: true },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return msg;
  });

  const payload = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    attachments: message.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      type: a.type,
      filename: a.filename,
    })),
  };
  emitNewMessage({
    conversationId: message.conversationId,
    messageId: message.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: payload.createdAt,
    attachmentCount: message.attachments.length,
  });
  return payload;
}
