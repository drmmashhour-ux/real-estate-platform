import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertConversationReadable } from "@/modules/messaging/messaging.service";
import { generateBrokerReplySuggestions, type ReplyIntent } from "@/modules/messaging/ai/ai-message.generator";
import { buildBrokerReplyContext } from "@/modules/messaging/ai/conversation-context";
import { crmMessageToLine } from "@/modules/messaging/ai/build-recent-lines";
import { logInfo } from "@/lib/logger";

const TAG = "[ai-message]";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/** POST /api/conversations/[id]/ai-suggestions — broker/admin only */
export async function POST(request: NextRequest, context: Params) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
  if (!BROKER_LIKE.has(user.role)) {
    return NextResponse.json({ error: "AI suggestions are limited to brokers" }, { status: 403 });
  }

  const { id: conversationId } = await context.params;
  const gate = await assertConversationReadable(user, conversationId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    intent?: ReplyIntent;
  };
  const intent: ReplyIntent =
    body.intent === "property" || body.intent === "negotiation" || body.intent === "follow_up"
      ? body.intent
      : "follow_up";

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
      offer: { select: { id: true } },
      contract: { select: { id: true, title: true } },
      appointment: { select: { id: true, title: true } },
      brokerClient: { select: { id: true, fullName: true } },
    },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const msgs = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { sender: { select: { role: true } } },
  });

  const chronological = msgs.reverse();
  const lines = chronological.map((m) =>
    crmMessageToLine(m.body, m.messageType, m.sender.role)
  );

  const detailView = {
    subject: conv.subject,
    context: {
      listing: conv.listing,
      offer: conv.offer ? { id: conv.offer.id } : null,
      contract: conv.contract,
      appointment: conv.appointment,
      brokerClient: conv.brokerClient,
    },
  };

  const ctx = buildBrokerReplyContext(detailView, lines);
  const result = await generateBrokerReplySuggestions({ ctx, intent });

  logInfo(`${TAG} conversation.suggestions`, {
    conversationId,
    source: result.source,
    count: result.suggestions.length,
  });

  return NextResponse.json({
    intent,
    source: result.source,
    suggestions: result.suggestions,
    law25:
      "AI-generated text must be reviewed before sending. Do not include personal data you do not need.",
  });
}
