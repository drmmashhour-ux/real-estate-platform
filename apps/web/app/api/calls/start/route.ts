import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { startCallSession } from "@/modules/messaging/call/call-session.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/**
 * Start an in-app call session (no recording implied). Recording URLs require explicit consent in metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) {
      return NextResponse.json({ ok: false, error: "Calls are available to brokers" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      conversationId?: string;
      recordingConsent?: boolean;
    };
    const conversationId = (body.conversationId ?? "").trim();
    if (!conversationId) {
      return NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conv) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (!canViewConversation(user, conv, conv.participants)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!(await canAccessConversationContext(user, conv))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const clientId = conv.participants.map((p) => p.userId).find((uid) => uid !== userId) ?? null;
    if (!clientId) {
      return NextResponse.json({ ok: false, error: "No counterparty in this conversation" }, { status: 400 });
    }

    const started = startCallSession({
      conversationId,
      brokerId: userId,
      clientId,
      metadata: {
        recordingConsent: body.recordingConsent === true,
        transcriptProcessingConsent: false,
      },
    });
    if (!started.ok) {
      return NextResponse.json({ ok: false, error: started.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, call: started.session }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not start call" }, { status: 200 });
  }
}
