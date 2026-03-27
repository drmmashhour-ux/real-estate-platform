import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ConversationAccess =
  | { ok: true; role: "guest" | "user" | "expert" | "admin" }
  | { ok: false; status: number; error: string };

export async function assertConversationAccess(params: {
  conversationId: string;
  userId: string | null;
  guestSessionId: string | null;
  platformRoleCookie: string | null;
  dbRole: PlatformRole | null;
}): Promise<ConversationAccess> {
  const convo = await prisma.crmConversation.findUnique({
    where: { id: params.conversationId },
    select: {
      userId: true,
      guestSessionId: true,
      expertId: true,
    },
  });
  if (!convo) return { ok: false, status: 404, error: "Conversation not found" };

  if (params.dbRole === "ADMIN" || params.platformRoleCookie === "admin") {
    return { ok: true, role: "admin" };
  }

  if (params.userId && convo.userId === params.userId) {
    return { ok: true, role: "user" };
  }

  if (
    params.guestSessionId &&
    convo.guestSessionId &&
    convo.guestSessionId === params.guestSessionId
  ) {
    return { ok: true, role: "guest" };
  }

  if (params.userId && convo.expertId) {
    const expert = await prisma.mortgageExpert.findFirst({
      where: { id: convo.expertId, userId: params.userId },
      select: { id: true },
    });
    if (expert) return { ok: true, role: "expert" };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}
