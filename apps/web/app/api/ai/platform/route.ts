import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { runAiTask } from "@/modules/ai/core/ai-client";
import type { AiHub, AiIntent } from "@/modules/ai/core/types";
import { sanitizeContext } from "@/modules/ai/core/ai-guardrails";

export const dynamic = "force-dynamic";

const HUBS = new Set<AiHub>(["buyer", "seller", "bnhub", "rent", "broker", "mortgage", "investor", "admin"]);
const INTENTS = new Set<AiIntent>(["suggestion", "summary", "draft", "explain", "analyze", "risk"]);

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const rlKey = `ai-platform:user:${userId}`;
  const rl = checkRateLimit(rlKey, { windowMs: 60 * 60 * 1000, max: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Try again later." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: {
    hub?: string;
    feature?: string;
    intent?: string;
    context?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hub = body.hub as AiHub;
  const feature = typeof body.feature === "string" ? body.feature.trim().slice(0, 96) : "";
  const intent = (body.intent ?? "analyze") as AiIntent;

  if (!hub || !HUBS.has(hub)) {
    return NextResponse.json({ error: "Invalid hub" }, { status: 400 });
  }
  if (!feature) {
    return NextResponse.json({ error: "feature required" }, { status: 400 });
  }
  if (!INTENTS.has(intent)) {
    return NextResponse.json({ error: "Invalid intent" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ctx =
    body.context && typeof body.context === "object" && !Array.isArray(body.context)
      ? sanitizeContext(body.context as Record<string, unknown>)
      : {};

  const result = await runAiTask({
    hub,
    feature,
    intent,
    context: ctx,
    userId,
    role: user.role,
  });

  return NextResponse.json(
    {
      ok: true,
      text: result.text,
      source: result.source,
      logId: result.logId ?? null,
      model: result.model ?? null,
    },
    { headers: getRateLimitHeaders(rl) }
  );
}
