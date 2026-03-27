import { NextRequest, NextResponse } from "next/server";
import type { ConversationType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { createDirectConversation } from "@/modules/messaging/services/create-conversation";
import { canCreateDirectConversation } from "@/modules/messaging/services/messaging-permissions";
import { getUserConversationInbox } from "@/modules/messaging/services/get-user-conversations";
import { notifyConversationCreated } from "@/modules/messaging/services/messaging-notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/conversations — inbox for current user.
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const typeRaw = searchParams.get("type");
  const type =
    typeRaw && typeRaw !== "ALL" ? (typeRaw as ConversationType | "ALL") : "ALL";
  const includeArchived = searchParams.get("archived") === "1" || searchParams.get("archived") === "true";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const conversations = await getUserConversationInbox({
    userId,
    search,
    type: type as "ALL" | ConversationType,
    includeArchived,
  });

  void trackDemoEvent(
    DemoEvents.MESSAGES_INBOX_VIEWED,
    { role: user.role },
    userId
  );

  return NextResponse.json({ conversations });
}

/**
 * POST /api/conversations — start a direct CRM thread (broker↔linked client only).
 * Body: { participantUserId: string }
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { participantUserId?: string };
  const other = typeof body.participantUserId === "string" ? body.participantUserId.trim() : "";
  if (!other) {
    return NextResponse.json({ error: "participantUserId is required" }, { status: 400 });
  }

  const allowed = await canCreateDirectConversation(user, other);
  if (!allowed) {
    return NextResponse.json({ error: "Cannot start this conversation" }, { status: 403 });
  }

  const otherExists = await prisma.user.findUnique({
    where: { id: other },
    select: { id: true },
  });
  if (!otherExists) {
    return NextResponse.json({ error: "Cannot start this conversation" }, { status: 400 });
  }

  const { conversation, created } = await createDirectConversation({
    createdById: userId,
    participantUserId: other,
  });

  if (created) {
    void trackDemoEvent(DemoEvents.CONVERSATION_CREATED, { conversationType: conversation.type }, userId);
    notifyConversationCreated({ conversationId: conversation.id, userId });
  }

  return NextResponse.json({ conversation: { id: conversation.id, type: conversation.type } });
}
