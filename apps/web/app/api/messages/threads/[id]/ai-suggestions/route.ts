import { NextRequest, NextResponse } from "next/server";
import { resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { getLecipmBrokerThreadDetail } from "@/lib/messages/get-thread";
import { generateBrokerReplySuggestions, type ReplyIntent } from "@/modules/messaging/ai/ai-message.generator";
import { trimRecentLines, type BrokerReplyContext } from "@/modules/messaging/ai/conversation-context";
import { lecipmSenderToLine } from "@/modules/messaging/ai/build-recent-lines";
import { logInfo } from "@/lib/logger";

const TAG = "[ai-message]";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST /api/messages/threads/[id]/ai-suggestions — listing-inquiry threads, broker/admin */
export async function POST(request: NextRequest, context: Params) {
  const { id: threadId } = await context.params;
  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get("guestToken");

  const resolved = await resolveThreadViewerFromRequest(request, guestToken);
  if (!resolved.viewer) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  if (resolved.viewer.kind !== "broker" && resolved.viewer.kind !== "admin") {
    return NextResponse.json({ error: "AI suggestions are limited to brokers" }, { status: 403 });
  }

  const detail = await getLecipmBrokerThreadDetail(threadId, resolved.viewer);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { intent?: ReplyIntent };
  const intent: ReplyIntent =
    body.intent === "property" || body.intent === "negotiation" || body.intent === "follow_up"
      ? body.intent
      : "follow_up";

  const lines = detail.messages.map((m) => lecipmSenderToLine(m.senderRole, m.body));

  const ctx: BrokerReplyContext = {
    subject: detail.thread.subject,
    listingTitle: detail.thread.listing?.title,
    city: undefined,
    lines: trimRecentLines(lines, 24),
  };

  const result = await generateBrokerReplySuggestions({ ctx, intent });

  logInfo(`${TAG} lecipm-thread.suggestions`, {
    threadId,
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
