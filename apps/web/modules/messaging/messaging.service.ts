import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  canAccessConversationContext,
  canSendMessage,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";

export type MessagingUser = { id: string; role: PlatformRole };

/**
 * Thin permission + load helpers for API routes and engines.
 */
export async function assertConversationReadable(user: MessagingUser, conversationId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conv) return { ok: false as const, status: 404 as const, error: "Not found" };
  if (!canViewConversation(user, conv, conv.participants)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }
  if (!(await canAccessConversationContext(user, conv))) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }
  return { ok: true as const, conversation: conv };
}

export async function assertCanSend(user: MessagingUser, conversationId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conv) return { ok: false as const, status: 404 as const, error: "Not found" };
  if (!canViewConversation(user, conv, conv.participants)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }
  if (!(await canAccessConversationContext(user, conv))) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }
  if (!canSendMessage(user, conv, conv.participants)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }
  return { ok: true as const, conversation: conv };
}
