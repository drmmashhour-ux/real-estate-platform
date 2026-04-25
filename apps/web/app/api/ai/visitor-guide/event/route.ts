import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  questionFingerprint,
  recordVisitorGuideAnalytics,
} from "@/modules/ai-guide/visitor-guide-metrics.service";

export const dynamic = "force-dynamic";

const KINDS = [
  "message_sent",
  "response_ok",
  "cta_click",
  "quick_question",
  "signup_nav",
] as const;
type EventKind = (typeof KINDS)[number];

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`visitor_guide_evt:${req.headers.get("x-forwarded-for") ?? "ip"}`, {
    windowMs: 60_000,
    max: 40,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    kind?: string;
    surface?: string;
    sessionId?: string;
    ctaKey?: string;
    questionText?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.kind || !KINDS.includes(body.kind as EventKind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const surface = body.surface === "dashboard" ? "dashboard" : "landing";
  const fp = body.questionText ? questionFingerprint(body.questionText) : undefined;

  try {
    await recordVisitorGuideAnalytics({
      kind: body.kind as EventKind,
      surface,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      extra: {
        ctaKey: body.ctaKey,
        qfp: fp,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[visitor-guide/event]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
