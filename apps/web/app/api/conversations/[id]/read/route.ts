import { NextResponse } from "next/server";
import { MessageEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { notifyUnreadConversation } from "@/modules/messaging/services/messaging-notifications";
import { publishConversationUpdate } from "@/modules/messaging/services/realtime-adapter";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/conversations/[id]/read */
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

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: now },
    });
    await tx.messageEvent.create({
      data: {
        conversationId,
        actorId: userId,
        type: MessageEventType.READ,
      },
    });
  });

  void notifyUnreadConversation({ conversationId, userId });
  publishConversationUpdate({ conversationId, kind: "read" });

  void trackDemoEvent(DemoEvents.CONVERSATION_READ, { conversationId }, userId);

  return NextResponse.json({ ok: true });
}
