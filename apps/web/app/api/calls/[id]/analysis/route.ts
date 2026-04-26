import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { getCallPostAnalysis, getCallSession, getSessionInternalForAnalysis } from "@/modules/messaging/call/call-session.service";
import { analyzeRealtimeSignals } from "@/modules/messaging/call/realtime-signal.service";
import { getLiveCallHints } from "@/modules/messaging/call/live-assistant.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Params = { params: Promise<{ id: string }> };

/**
 * GET: post-call analysis (after end) or light live hints when `?live=1` and call is still active.
 * Never auto-executes actions. Safe JSON; errors return ok: false, not 500 throw.
 */
export async function GET(request: NextRequest, context: Params) {
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
    const live = request.nextUrl.searchParams.get("live") === "1" || request.nextUrl.searchParams.get("live") === "true";

    const row = getCallSession(callId);
    if (!row.ok) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
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

    if (live && row.session.status === "active") {
      const internal = getSessionInternalForAnalysis(callId);
      const events = internal?.events ?? [];
      const signals = analyzeRealtimeSignals({
        startedAt: row.session.startedAt,
        now: new Date().toISOString(),
        events,
      });
      const elapsedSec = Math.max(0, (Date.now() - Date.parse(row.session.startedAt)) / 1000);
      const { hints } = getLiveCallHints({ signals, elapsedSec });
      return NextResponse.json(
        {
          ok: true,
          live: true,
          call: row.session,
          realtimeSignals: signals,
          liveHints: hints,
        },
        { status: 200 }
      );
    }

    const analysis = getCallPostAnalysis(callId);
    if (!analysis) {
      return NextResponse.json(
        {
          ok: true,
          analysis: null,
          message: "Post-call analysis is not ready yet — end the call from the app or try again in a moment.",
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ ok: true, analysis, call: row.session }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load call analysis" }, { status: 200 });
  }
}
