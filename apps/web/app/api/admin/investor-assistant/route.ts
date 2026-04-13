import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { loadInvestorReportBundle } from "@/src/modules/investor-metrics/investorReportBundle";

export const dynamic = "force-dynamic";

const MODEL = process.env.INVESTOR_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";

type Action = "summarize_metrics" | "suggest_answer" | "pitch_line";

/** POST — Investor Assistant: metrics summary, answer suggestion, or pitch line. */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { action?: string; question?: string; draft?: string; topic?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (action !== "summarize_metrics" && action !== "suggest_answer" && action !== "pitch_line") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "summarize_metrics") {
    const bundle = await loadInvestorReportBundle(new Date());
    if (!openai || !isOpenAiConfigured()) {
      return NextResponse.json({
        text: bundle.fullText.slice(0, 4000),
        source: "bundle_only",
      });
    }
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are an investor relations assistant. Summarize the metrics block in 6-10 bullet points for a founder preparing for a VC call. Be precise; do not invent numbers.",
        },
        { role: "user", content: bundle.fullText.slice(0, 12000) },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text, source: "openai" });
  }

  if (action === "suggest_answer") {
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const draft = typeof body.draft === "string" ? body.draft.trim() : "";
    if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });
    if (!openai || !isOpenAiConfigured()) {
      return NextResponse.json({
        text:
          "Configure OPENAI_API_KEY for AI suggestions. Structure your answer: (1) one-line thesis (2) proof with metric or example (3) risk + mitigation.",
        source: "fallback",
      });
    }
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Improve a founder answer for investor diligence. Output a concise improved answer (120-220 words), no markdown headings.",
        },
        {
          role: "user",
          content: JSON.stringify({ question, draft: draft || "(none)" }),
        },
      ],
    });
    return NextResponse.json({ text: res.choices[0]?.message?.content?.trim() ?? "", source: "openai" });
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "marketplace";
  if (!openai || !isOpenAiConfigured()) {
    return NextResponse.json({
      text: `LECIPM: Québec-first real estate + BNHUB marketplace — unified discovery, trust, and transactions for serious operators (${topic}).`,
      source: "fallback",
    });
  }
  const res = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: "Write ONE compelling pitch line (max 35 words) for a startup pitch deck. No quotes.",
      },
      { role: "user", content: `Topic focus: ${topic}` },
    ],
  });
  return NextResponse.json({ text: res.choices[0]?.message?.content?.trim() ?? "", source: "openai" });
}
