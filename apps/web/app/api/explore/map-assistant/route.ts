import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateText, isGeminiConfigured } from "@/lib/ai/gemini";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE = 4000;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon"
  );
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Gemini is not configured (GEMINI_API_KEY)." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const rl = checkRateLimit(`explore:map-assistant:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: { message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const raw = typeof body.message === "string" ? body.message.trim() : "";
  if (!raw) {
    return NextResponse.json({ ok: false, error: "message required" }, { status: 400 });
  }
  const message = raw.slice(0, MAX_MESSAGE);

  const system = [
    "You are a concise assistant for Québec real estate buyers using LECIPM (a real estate platform).",
    "Help with map search, neighborhoods, commute ideas, and how to use filters — not legal or tax advice.",
    "Prefer short paragraphs or bullets. If unsure, suggest checking listings on the site or a licensed professional.",
    "Respond in the same language as the user's message (English or French).",
  ].join(" ");

  const result = await geminiGenerateText(message, { system });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, text: result.text }, { headers: getRateLimitHeaders(rl) });
}
