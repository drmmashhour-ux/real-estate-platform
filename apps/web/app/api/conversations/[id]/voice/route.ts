import { NextRequest, NextResponse } from "next/server";
import { MessageEventType, MessageType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import {
  canAccessConversationContext,
  canSendMessage,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { notifyNewMessage } from "@/modules/messaging/services/messaging-notifications";
import { publishConversationUpdate } from "@/modules/messaging/services/realtime-adapter";
import { onNewMessage } from "@/modules/notifications/services/workflow-notification-triggers";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { saveVoiceClip } from "@/modules/messaging/voice/voice-message.service";
import type { VoiceMessagePayload } from "@/modules/messaging/voice/voice.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** POST multipart: `audio` file, optional `durationSec`, `mimeType` */
export async function POST(request: NextRequest, context: Params) {
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
  if (!canSendMessage(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const priorSent = await prisma.message.count({ where: { senderId: userId } });
  if (priorSent === 0) {
    const licenseBlock = await requireContentLicenseAccepted(userId);
    if (licenseBlock) return licenseBlock;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio field required" }, { status: 400 });
  }

  const durationRaw = form.get("durationSec");
  const durationSec =
    typeof durationRaw === "string" && durationRaw.trim() ? parseFloat(durationRaw) : undefined;
  const mimeOverride = form.get("mimeType");
  const mimeType =
    (typeof mimeOverride === "string" && mimeOverride.trim()) || file.type || "audio/webm";

  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveVoiceClip({
    conversationId,
    senderUserId: userId,
    buffer: buf,
    mimeType,
    durationSec: Number.isFinite(durationSec) ? durationSec : undefined,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  const metadata = saved.payload as VoiceMessagePayload;

  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: "Voice message",
        messageType: MessageType.VOICE,
        metadata: metadata as object,
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
    preview: "Voice message",
  });
  publishConversationUpdate({ conversationId, kind: "message_created", messageId: msg.id });

  void trackDemoEvent(DemoEvents.MESSAGE_SENT, { conversationType: conv.type }, userId);

  return NextResponse.json({
    message: {
      id: msg.id,
      messageType: MessageType.VOICE,
      metadata,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
