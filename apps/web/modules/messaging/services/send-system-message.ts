import { MessageEventType, MessageType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MESSAGE_BODY_MAX_LENGTH } from "@/modules/messaging/services/constants";
import { notifyNewMessage } from "@/modules/messaging/services/messaging-notifications";
import { publishConversationUpdate } from "@/modules/messaging/services/realtime-adapter";

/**
 * Inserts a SYSTEM line in a thread (workflow context). Uses MessageType.SYSTEM.
 * Sender is a real User id (actor or first participant) — UI should render as system, not as personal chat.
 */
export async function sendSystemMessage(
  conversationId: string,
  body: string,
  opts?: { actorId?: string | null }
) {
  const trimmed = body.trim().slice(0, MESSAGE_BODY_MAX_LENGTH);
  if (!trimmed) return null;

  return prisma.$transaction(async (tx) => {
    let senderId = opts?.actorId ?? null;
    if (!senderId) {
      const p = await tx.conversationParticipant.findFirst({
        where: { conversationId },
        orderBy: { joinedAt: "asc" },
        select: { userId: true },
      });
      senderId = p?.userId ?? null;
    }
    if (!senderId) return null;

    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId,
        body: trimmed,
        messageType: MessageType.SYSTEM,
      },
    });
    const now = new Date();
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now },
    });
    await tx.messageEvent.create({
      data: {
        conversationId,
        messageId: msg.id,
        actorId: opts?.actorId ?? senderId,
        type: MessageEventType.MESSAGE_SENT,
      },
    });
    const recipients = await tx.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipientUserIds = recipients.map((r) => r.userId).filter((id) => id !== senderId);
    void notifyNewMessage({ conversationId, messageId: msg.id, recipientUserIds });
    publishConversationUpdate({ conversationId, kind: "message_created", messageId: msg.id });
    return msg;
  });
}

/** If an APPOINTMENT-type conversation exists for this visit, post one system line (no-op otherwise). */
export async function sendSystemMessageForAppointmentIfExists(
  appointmentId: string,
  body: string,
  opts?: { actorId?: string | null }
) {
  const conv = await prisma.conversation.findFirst({
    where: { appointmentId },
    select: { id: true },
  });
  if (!conv) return null;
  return sendSystemMessage(conv.id, body, opts);
}
