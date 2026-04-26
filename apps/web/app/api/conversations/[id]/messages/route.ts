import { NextRequest, NextResponse } from "next/server";
import { MessageEventType, MessageType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { isPublicDemoMode } from "@/lib/demo-mode";
import {
  canAccessConversationContext,
  canSendMessage,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { parseMessageBody } from "@/modules/messaging/services/parse-message-body";
import { notifyNewMessage } from "@/modules/messaging/services/messaging-notifications";
import { publishConversationUpdate } from "@/modules/messaging/services/realtime-adapter";
import { onNewMessage } from "@/modules/notifications/services/workflow-notification-triggers";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { buildBrokerMessageQuebecMetadata } from "@/lib/compliance/quebec/chat-bilingual-metadata";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/conversations/[id]/messages */
export async function GET(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: conversationId } = await context.params;
  const { searchParams } = new URL(request.url);
  const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10) || 50, 100);

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

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    include: { sender: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    messages: messages.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      messageType: m.messageType,
      metadata: m.metadata ?? null,
      createdAt: m.createdAt.toISOString(),
      editedAt: m.editedAt?.toISOString() ?? null,
      senderId: m.senderId,
      sender: { name: m.sender.name, email: m.sender.email },
    })),
  });
}

/** POST /api/conversations/[id]/messages */
export async function POST(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: conversationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { body?: unknown };
  const parsed = parseMessageBody(body.body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

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
  if (!canSendMessage(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const priorSent = await prisma.message.count({ where: { senderId: userId } });
  if (priorSent === 0) {
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
  }

  const quebecMeta = await buildBrokerMessageQuebecMetadata({ role: user.role, body: parsed.body });

  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: parsed.body,
        messageType: MessageType.TEXT,
        ...(quebecMeta ? { metadata: quebecMeta as Prisma.InputJsonValue } : {}),
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
        messageId: m.id,
        actorId: userId,
        type: MessageEventType.MESSAGE_SENT,
      },
    });
    return m;
  });

  const recipients = conv.participants.map((p) => p.userId).filter((id) => id !== userId);
  void notifyNewMessage({ conversationId, messageId: msg.id, recipientUserIds: recipients });
  void onNewMessage({
    recipientUserIds: recipients,
    senderId: userId,
    conversationId,
    preview: parsed.body.slice(0, 200),
  });
  publishConversationUpdate({ conversationId, kind: "message_created", messageId: msg.id });

  void trackDemoEvent(
    DemoEvents.MESSAGE_SENT,
    { conversationType: conv.type },
    userId
  );

  return NextResponse.json({
    message: {
      id: msg.id,
      body: msg.body,
      messageType: msg.messageType,
      metadata: msg.metadata ?? null,
      createdAt: msg.createdAt.toISOString(),
    },
    demoDisclaimer: isPublicDemoMode()
      ? "This is a demo conversation environment. No external message is sent."
      : undefined,
  });
}
