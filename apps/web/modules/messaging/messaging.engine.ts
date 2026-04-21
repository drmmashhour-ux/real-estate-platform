import type { MessageType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MessageMetadata } from "@/modules/messaging/message.model";
import { logMessagingInfo } from "@/modules/messaging/messaging-logger";

export type AppendMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  messageType?: MessageType;
  metadata?: MessageMetadata | null;
};

/**
 * Low-level message append for automation / system notes. User-facing sends stay in API routes
 * so license checks and notifications stay centralized.
 */
export async function appendConversationMessage(input: AppendMessageInput) {
  const msg = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
      messageType: input.messageType ?? "TEXT",
      metadata: input.metadata ?? undefined,
    },
  });
  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: new Date() },
  });
  logMessagingInfo("message.append", {
    conversationId: input.conversationId,
    messageId: msg.id,
    messageType: input.messageType ?? "TEXT",
  });
  return msg;
}
