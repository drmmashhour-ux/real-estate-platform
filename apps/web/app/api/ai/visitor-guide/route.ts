import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  questionFingerprint,
  recordVisitorGuideAnalytics,
} from "@/modules/ai-guide/visitor-guide-metrics.service";
import { generateGuideResponse, type VisitorGuideSurface } from "@/modules/ai-guide/visitor-guide.agent";

export const dynamic = "force-dynamic";

const SURFACES: VisitorGuideSurface[] = ["landing", "dashboard"];

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`visitor_guide:${req.headers.get("x-forwarded-for") ?? "ip"}`, {
    windowMs: 60_000,
    max: 20,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    message?: string;
    surface?: string;
    lastUserMessages?: string[];
    turnIndex?: number;
    sessionId?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const surface = typeof body.surface === "string" ? body.surface.trim() : "landing";
  if (!SURFACES.includes(surface as VisitorGuideSurface)) {
    return NextResponse.json({ error: "Invalid surface" }, { status: 400 });
  }

  const lastUserMessages = Array.isArray(body.lastUserMessages)
    ? body.lastUserMessages.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean).slice(-5)
    : [];
  const turnIndex = typeof body.turnIndex === "number" && Number.isFinite(body.turnIndex) ? Math.max(0, Math.floor(body.turnIndex)) : 0;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 80) : null;

  void recordVisitorGuideAnalytics({
    kind: "message_sent",
    surface: surface as "landing" | "dashboard",
    sessionId,
    extra: { qfp: questionFingerprint(message), turnIndex },
  }).catch(() => {});

  try {
    const result = await generateGuideResponse({
      surface: surface as VisitorGuideSurface,
      userMessage: message,
      lastUserMessages,
      turnIndex,
    });

    void recordVisitorGuideAnalytics({
      kind: "response_ok",
      surface: surface as "landing" | "dashboard",
      sessionId,
      extra: {
        qfp: questionFingerprint(message),
        turnIndex,
        intent: result.intent,
        ctaUsed: result.ctaUsed,
      },
    }).catch(() => {});

    return NextResponse.json({
      reply: result.reply,
      intent: result.intent,
      ctaUsed: result.ctaUsed,
    });
  } catch (e) {
    console.error("[visitor-guide]", e);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
