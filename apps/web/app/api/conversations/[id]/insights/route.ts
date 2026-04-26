import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { analyzeConversation } from "@/modules/messaging/analysis/conversation-analysis.engine";
import {
  buildMemorySnapshot,
  mergeExtractedPreferences,
} from "@/modules/crm-memory/memory.engine";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/** GET conversation insights (broker/admin). POST { syncPreferences?: true } merges extraction into CRM memory. */
export async function GET(_request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
  if (!BROKER_LIKE.has(user.role)) {
    return NextResponse.json({ error: "Insights are available to brokers" }, { status: 403 });
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
  if (!counterpartyId) {
    return NextResponse.json({ error: "No counterparty in thread" }, { status: 400 });
  }

  const rows = await prisma.message.findMany({
    where: { conversationId, deletedAt: null, messageType: { not: "SYSTEM" } },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { body: true, senderId: true, createdAt: true, messageType: true },
  });

  const analysis = analyzeConversation({
    messages: rows.map((r) => ({
      body: r.messageType === "VOICE" ? "" : r.body,
      senderId: r.senderId,
      createdAt: r.createdAt.toISOString(),
    })),
    viewerId: userId,
    counterpartyId,
  });

  const texts = rows.map((r) => r.body).filter(Boolean);
  const memory = await buildMemorySnapshot({
    clientId: counterpartyId,
    brokerId: userId,
    messageTexts: texts,
  });

  return NextResponse.json({
    analysis,
    clientInsights: {
      profile: memory.profile,
      notes: memory.notes,
      counterpartyUserId: counterpartyId,
    },
  });
}

export async function POST(request: NextRequest, context: Params) {
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
  const body = (await request.json().catch(() => ({}))) as { syncPreferences?: boolean };

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

  if (body.syncPreferences) {
    const rows = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { body: true },
    });
    await mergeExtractedPreferences({
      clientId: counterpartyId,
      brokerId: userId,
      messageTexts: rows.map((r) => r.body),
    });
    return NextResponse.json({ ok: true, synced: true });
  }

  return NextResponse.json({ ok: false, error: "No action" }, { status: 400 });
}
