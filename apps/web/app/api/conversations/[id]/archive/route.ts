import { NextResponse } from "next/server";
import { MessageEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  canAccessConversationContext,
  canArchiveConversation,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/conversations/[id]/archive — participant-scoped */
export async function POST(_request: Request, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: conversationId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canViewConversation(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await canAccessConversationContext(user, conv))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canArchiveConversation(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { isArchived: true },
    });
    await tx.messageEvent.create({
      data: {
        conversationId,
        actorId: userId,
        type: MessageEventType.CONVERSATION_ARCHIVED,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
