import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { getCallSession, trackCallEvent } from "@/modules/messaging/call/call-session.service";
import type { CallEvent } from "@/modules/messaging/call/call.types";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Params = { params: Promise<{ id: string }> };

/**
 * Optional: send timing events for live hint quality (no audio). Additive to main call APIs.
 */
export async function POST(request: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: callId } = await context.params;
    const row = getCallSession(callId);
    if (!row.ok) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (row.session.brokerId !== userId) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: row.session.conversationId },
      include: { participants: true },
    });
    if (!conv) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (!canViewConversation(user, conv, conv.participants)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!(await canAccessConversationContext(user, conv))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: CallEvent["type"];
      timestamp?: string;
      speaker?: CallEvent["speaker"];
      durationMs?: number;
    };
    if (!body.type) {
      return NextResponse.json({ ok: false, error: "type required" }, { status: 400 });
    }
    const ev: CallEvent = {
      timestamp: (body.timestamp ?? new Date().toISOString()).slice(0, 40),
      type: body.type,
      speaker: body.speaker,
      durationMs: body.durationMs,
    };
    const t = trackCallEvent(callId, ev);
    if (!t.ok) {
      return NextResponse.json({ ok: false, error: t.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not track event" }, { status: 200 });
  }
}
