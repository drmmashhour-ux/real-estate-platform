import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isOpenAiConfigured } from "@/lib/ai/openai";
import { generateText, type ListingContext, type WriterAction, type WriterType } from "@/lib/ai/writer";
import { logAiEvent } from "@/lib/ai/log";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TYPES = new Set<WriterType>(["listing", "message", "mortgage", "general"]);
const ACTIONS = new Set<WriterAction>([
  "generate",
  "professional",
  "shorter",
  "persuasive",
  "translate_fr",
  "translate_en",
  "correct_writing",
]);

const MAX_PROMPT = 12_000;

function parseListingContext(raw: unknown): ListingContext | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    propertyType: typeof o.propertyType === "string" ? o.propertyType : undefined,
    location: typeof o.location === "string" ? o.location : undefined,
    price: typeof o.price === "string" ? o.price : undefined,
    features: typeof o.features === "string" ? o.features : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "anon";

    const rlKey = userId ? `ai-write:user:${userId}` : `ai-write:ip:${ip}`;
    const rl = checkRateLimit(rlKey, { windowMs: 60 * 60 * 1000, max: userId ? 80 : 25 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many AI requests. Try again later." },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await req.json().catch(() => null) as {
      prompt?: string;
      type?: string;
      action?: string;
      listingContext?: unknown;
    } | null;

    const promptRaw = typeof body?.prompt === "string" ? body.prompt : "";
    const prompt = promptRaw.slice(0, MAX_PROMPT);

    const type = (body?.type ?? "general") as WriterType;
    if (!TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const action = (body?.action ?? (type === "listing" ? "generate" : "professional")) as WriterAction;
    if (!ACTIONS.has(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const listingContext = type === "listing" && action === "generate" ? parseListingContext(body?.listingContext) : null;

    const text = await generateText(prompt, type, { action, listingContext });
    const offline = !isOpenAiConfigured();
    const offlineHint = offline
      ? "Sample mode: set OPENAI_API_KEY on the server for live AI rewrites and translations."
      : undefined;

    try {
      await prisma.aiWriterUsageLog.create({
        data: {
          userId: userId ?? null,
          type,
          action,
          promptLen: prompt.length,
        },
      });
    } catch (e) {
      logError("ai write log", e);
    }

    logAiEvent("ai_writer_request", {
      type,
      action,
      userId: userId ?? null,
      promptLen: prompt.length,
    });

    return NextResponse.json(
      { text, type, action, offline, ...(offlineHint ? { offlineHint } : {}) },
      { headers: getRateLimitHeaders(rl) }
    );
  } catch (e) {
    logError("POST /api/ai/write", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
