import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { getOrCreateConversationForContext } from "@/modules/messaging/services/create-conversation";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";
import { notifyConversationCreated } from "@/modules/messaging/services/messaging-notifications";

export const dynamic = "force-dynamic";

const KINDS = new Set<ContextKind>(["listing", "offer", "contract", "appointment", "client"]);

/**
 * POST /api/conversations/context — get or create a context-linked thread.
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    contextId?: string;
  };
  const type = body.type as ContextKind | undefined;
  const contextId = typeof body.contextId === "string" ? body.contextId.trim() : "";

  if (!type || !KINDS.has(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!contextId) {
    return NextResponse.json({ error: "contextId is required" }, { status: 400 });
  }

  try {
    const { conversation, created } = await getOrCreateConversationForContext(type, contextId, userId);
    if (created) {
      void trackDemoEvent(
        DemoEvents.CONVERSATION_CREATED,
        { conversationType: conversation.type },
        userId
      );
      notifyConversationCreated({ conversationId: conversation.id, userId });
    }
    return NextResponse.json({ conversationId: conversation.id, type: conversation.type, created });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Cannot open conversation" }, { status: 400 });
  }
}
