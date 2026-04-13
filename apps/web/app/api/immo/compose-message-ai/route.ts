/**
 * POST /api/immo/compose-message-ai — Gemini-assisted drafting for ImmoContact / transaction-style messages.
 * Rate-limited; does not send messages or replace licensed advice.
 */

import { NextRequest } from "next/server";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { geminiGenerateText, isGeminiConfigured } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

type Body = {
  audience?: string;
  intent?: string;
  listingTitle?: string;
  location?: string;
  listingCode?: string | null;
  draftNotes?: string;
  tone?: "polite" | "direct" | "formal";
};

export async function POST(req: NextRequest) {
  const gate = await gateDistributedRateLimit(req, "public:immo-compose-ai", { windowMs: 60_000, max: 8 });
  if (!gate.allowed) return gate.response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draftNotes = typeof body.draftNotes === "string" ? body.draftNotes.trim() : "";
  if (draftNotes.length < 3) {
    return Response.json({ error: "Add a few words about what you want to say (draft notes)." }, { status: 400 });
  }

  if (!isGeminiConfigured()) {
    return Response.json(
      { error: "AI drafting is not configured (GEMINI_API_KEY).", configured: false },
      { status: 503 }
    );
  }

  const audience = typeof body.audience === "string" ? body.audience.trim().slice(0, 48) : "broker";
  const intent = typeof body.intent === "string" ? body.intent.trim().slice(0, 120) : "inquiry";
  const listingTitle = typeof body.listingTitle === "string" ? body.listingTitle.trim().slice(0, 200) : "";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 200) : "";
  const listingCode =
    typeof body.listingCode === "string" && body.listingCode.trim() ? body.listingCode.trim().slice(0, 32) : "";
  const tone = body.tone === "direct" || body.tone === "formal" ? body.tone : "polite";

  const userPrompt = `You help a real-estate marketplace user write a short message to the transaction party.

Context:
- Audience (who they are writing to): ${audience}
- Intent: ${intent}
- Property title: ${listingTitle || "—"}
- Location: ${location || "—"}
${listingCode ? `- Listing reference code: ${listingCode}` : ""}
- User's rough notes / bullet ideas (may be messy):
"""
${draftNotes.slice(0, 4000)}
"""

Requirements:
- Tone: ${tone}, professional, respectful.
- 2–6 short paragraphs OR a concise letter under 220 words.
- Do not invent facts (price, offers, legal status). If details are missing, suggest they confirm with their broker.
- Do not claim regulatory authority or give legal/financial advice.
- End with a clear ask or next step.
- Plain text only, no markdown headings.`;

  const result = await geminiGenerateText(userPrompt, {
    system:
      "You draft clear real-estate correspondence for buyers, sellers, and hosts. You never fabricate property facts or promise outcomes.",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ message: result.text, configured: true });
}
