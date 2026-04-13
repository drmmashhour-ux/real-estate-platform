import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateText, isGeminiConfigured } from "@/lib/ai/gemini";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

const ACTIONS = new Set([
  "translate_fr",
  "translate_en",
  "polish_professional",
  "expand_bio",
  "email_followup",
  "summarize_for_client",
]);

export async function POST(req: NextRequest) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI assistant is not configured. Add GEMINI_API_KEY to enable Gemini." },
      { status: 503 }
    );
  }

  const rl = checkRateLimit(`mortgage:expert_ai:${session.expert.id}`, { windowMs: 60_000, max: 24 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: unknown;
    text?: unknown;
    targetLangNote?: unknown;
  };
  const action = typeof body.action === "string" ? body.action.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!action || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  if (!text || text.length > 12_000) {
    return NextResponse.json({ error: "Text required (max 12,000 characters)." }, { status: 400 });
  }

  const system =
    "You are a senior mortgage financing specialist assistant for Québec / Canada brokers. " +
    "Output only the transformed text — no preamble, no markdown fences unless the user text already uses them.";

  let userPrompt: string;
  switch (action) {
    case "translate_fr":
      userPrompt = `Translate the following into clear Canadian French (professional mortgage / finance tone). Keep names, numbers, and currency as appropriate:\n\n${text}`;
      break;
    case "translate_en":
      userPrompt = `Translate the following into clear Canadian English (professional mortgage / finance tone):\n\n${text}`;
      break;
    case "polish_professional":
      userPrompt = `Rewrite for a polished, trustworthy professional tone suitable for clients and compliance review. Keep meaning; do not add promises or rates:\n\n${text}`;
      break;
    case "expand_bio":
      userPrompt = `Expand this short broker bio into 2–3 concise paragraphs for a public directory (professional, AMF-aligned, no superlatives or guaranteed outcomes):\n\n${text}`;
      break;
    case "email_followup":
      userPrompt = `Turn these notes into a short client email (subject line on first line as "Subject: ...", then blank line, then body). Warm, professional, compliant:\n\n${text}`;
      break;
    case "summarize_for_client":
      userPrompt = `Summarize for a layperson client in plain language (bullet list if helpful). No legal advice disclaimer beyond a single short line at the end:\n\n${text}`;
      break;
    default:
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const out = await geminiGenerateText(userPrompt, { system });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, result: out.text, source: "gemini" });
}
