import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { runMessagingAutopilot } from "@/modules/messaging/autopilot/autopilot.engine";
import { buildMemorySnapshot } from "@/modules/crm-memory/memory.engine";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const TAG = "[autopilot]";

/** POST — generate controlled autopilot draft for last client message (or body.clientMessage). */
export async function POST(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
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

  const body = (await request.json().catch(() => ({}))) as {
    clientMessage?: string;
  };

  let incoming = typeof body.clientMessage === "string" ? body.clientMessage.trim() : "";

  if (!incoming) {
    const msgs = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: { body: true, senderId: true, messageType: true },
    });
    const counterpartyId = conv.participants.map((p) => p.userId).find((uid) => uid !== userId);
    const fromClient = msgs.find(
      (m) => m.senderId === counterpartyId && m.messageType !== "SYSTEM"
    );
    incoming = fromClient?.body?.trim() ?? "";
  }

  if (!incoming) {
    return NextResponse.json({ error: "No client message to respond to" }, { status: 400 });
  }

  const setting = await prisma.lecipmBrokerAutopilotSetting.findUnique({
    where: { brokerUserId: userId },
  });

  const counterpartyId = conv.participants.map((p) => p.userId).find((uid) => uid !== userId);
  let profileSummary: string | undefined;
  if (counterpartyId) {
    const recent = await prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { body: true },
    });
    const snap = await buildMemorySnapshot({
      clientId: counterpartyId,
      brokerId: userId,
      messageTexts: recent.map((m) => m.body),
    });
    profileSummary = JSON.stringify(snap.profile);
  }

  const transcriptSummary = incoming.slice(0, 4000);

  const result = await runMessagingAutopilot({
    prismaMode: setting?.mode ?? "assist",
    incomingClientMessage: incoming,
    transcriptSummary,
    clientProfileSummary: profileSummary,
  });

  if (!result) {
    return NextResponse.json({ error: "Autopilot is off" }, { status: 400 });
  }

  logInfo(`${TAG} draft.generated`, {
    conversationId,
    risk: result.riskLevel,
  });

  return NextResponse.json({
    ...result,
    labeling: "AI-generated draft — visible to broker before send",
  });
}
