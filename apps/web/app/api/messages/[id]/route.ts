import { NextRequest, NextResponse } from "next/server";
import { MessageEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { parseMessageBody } from "@/modules/messaging/services/parse-message-body";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/messages/[id] — edit own non-deleted text message */
export async function PATCH(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: messageId } = await context.params;
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

  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { participants: true } } },
  });
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.senderId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.messageType !== "TEXT") {
    return NextResponse.json({ error: "Cannot edit this message type" }, { status: 400 });
  }

  const conv = existing.conversation;
  if (!canViewConversation(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await canAccessConversationContext(user, conv))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.message.update({
      where: { id: messageId },
      data: { body: parsed.body, editedAt: now },
    });
    await tx.messageEvent.create({
      data: {
        conversationId: conv.id,
        messageId,
        actorId: userId,
        type: MessageEventType.MESSAGE_EDITED,
      },
    });
    return m;
  });

  return NextResponse.json({
    message: {
      id: updated.id,
      body: updated.body,
      editedAt: updated.editedAt?.toISOString() ?? null,
    },
  });
}

/** DELETE /api/messages/[id] — soft-delete own message */
export async function DELETE(_request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: messageId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { participants: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.senderId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conv = existing.conversation;
  if (!canViewConversation(user, conv, conv.participants)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await canAccessConversationContext(user, conv))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: messageId },
      data: {
        deletedAt: now,
        body: "[Message removed]",
      },
    });
    await tx.messageEvent.create({
      data: {
        conversationId: conv.id,
        messageId,
        actorId: userId,
        type: MessageEventType.MESSAGE_DELETED,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
