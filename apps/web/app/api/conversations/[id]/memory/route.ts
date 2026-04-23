import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { upsertClientMemoryNotes } from "@/modules/crm-memory/memory.engine";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/** PATCH broker notes / preference overrides for counterparty client */
export async function PATCH(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
  if (!BROKER_LIKE.has(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: conversationId } = await context.params;
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

  const counterpartyId = conv.participants.map((p) => p.userId).find((uid) => uid !== userId);
  if (!counterpartyId) return NextResponse.json({ error: "No counterparty" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    notes?: string;
    preferences?: Record<string, unknown>;
  };

  await upsertClientMemoryNotes({
    clientId: counterpartyId,
    brokerId: userId,
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    ...(body.preferences && typeof body.preferences === "object" ? { preferences: body.preferences } : {}),
  });

  return NextResponse.json({ ok: true });
}
