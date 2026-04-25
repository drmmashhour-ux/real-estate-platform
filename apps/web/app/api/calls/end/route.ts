import { NextRequest, NextResponse } from "next/server";
import { MessageType, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import {
  endCallSession,
  getCallSession,
  setCallPostAnalysis,
  updateCallSessionMetadata,
} from "@/modules/messaging/call/call-session.service";
import { attachTranscript, getTranscriptText } from "@/modules/messaging/call/transcript.service";
import { runPostCallAnalysis } from "@/modules/messaging/call/post-call-analysis.engine";
import { buildMemorySnapshot } from "@/modules/messaging/crm-memory/memory.engine";
import { applyPostCallCrmSync } from "@/modules/messaging/call/call-crm-sync.service";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/**
 * End a call, optionally attach transcript, run post-call heuristics, and merge into CRM (high-confidence / safe paths only).
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
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      callId?: string;
      transcript?: string;
      transcriptProcessingConsent?: boolean;
      /** Only stored when the session had recording consent at start. */
      recordingUrl?: string;
    };
    const callId = (body.callId ?? "").trim();
    if (!callId) {
      return NextResponse.json({ ok: false, error: "callId required" }, { status: 400 });
    }

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
    if (!conv) return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    if (!canViewConversation(user, conv, conv.participants)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!(await canAccessConversationContext(user, conv))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const t = (body.transcript ?? "").trim();
    let transcriptConsented = false;
    if (t.length > 0) {
      const att = attachTranscript(callId, t, { transcriptProcessingConsent: body.transcriptProcessingConsent === true });
      transcriptConsented = att.ok;
    }
    if (body.recordingUrl && row.session.metadata.recordingConsent === true) {
      void updateCallSessionMetadata(callId, { recordingUrl: String(body.recordingUrl).slice(0, 2000) });
    }

    const ended = endCallSession(callId);
    if (!ended.ok) {
      return NextResponse.json({ ok: false, error: ended.error }, { status: 400 });
    }
    const session = getCallSession(callId);
    if (!session.ok) {
      return NextResponse.json({ ok: false, error: "Inconsistent call state" }, { status: 500 });
    }

    const textRows = await prisma.message.findMany({
      where: { conversationId: row.session.conversationId, deletedAt: null, messageType: { not: MessageType.SYSTEM } },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: { body: true },
    });
    const threadLines = textRows.map((m) => m.body).filter(Boolean);
    const storedTranscript = getTranscriptText(callId) ?? (transcriptConsented ? t : undefined);
    const memory = await buildMemorySnapshot({
      clientId: row.session.clientId,
      brokerId: userId,
      messageTexts: storedTranscript && storedTranscript.trim().length > 0 ? [...threadLines, storedTranscript] : threadLines,
    });

    const result = runPostCallAnalysis(
      ended.session,
      storedTranscript && storedTranscript.length > 0 ? storedTranscript : undefined,
      memory
    );
    setCallPostAnalysis(callId, result);

    void applyPostCallCrmSync({
      clientId: row.session.clientId,
      brokerId: userId,
      conversationId: row.session.conversationId,
      callId,
      result,
      transcriptText: storedTranscript,
      didConsentTranscript: transcriptConsented,
    });

    return NextResponse.json(
      {
        ok: true,
        call: session.session,
        analysis: result,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Could not end call" }, { status: 200 });
  }
}
