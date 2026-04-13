import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import type { InvestorSessionAnswer } from "@prisma/client";

const MODEL = process.env.INVESTOR_EVAL_MODEL?.trim() || "gpt-4o-mini";

export type SessionSummary = {
  averageScore: number;
  strengths: string;
  weaknesses: string;
  recommendedImprovements: string;
};

export function buildTemplateSessionSummary(
  answers: Array<Pick<InvestorSessionAnswer, "score" | "aiFeedback">>,
): SessionSummary {
  const scores = answers.map((a) => a.score).filter((s): s is number => typeof s === "number");
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const low = answers.filter((a) => (a.score ?? 0) < 60);
  return {
    averageScore: avg,
    strengths:
      scores.some((s) => s >= 75)
        ? "You had at least one strong answer—keep using specifics and metrics when challenged."
        : "Complete more practice sessions with longer, evidence-backed answers to build consistency.",
    weaknesses:
      low.length > 0
        ? `${low.length} answer(s) scored under 60—tighten structure (context → proof → takeaway) and add numbers where possible.`
        : "Review feedback per question for fine-grained improvements.",
    recommendedImprovements:
      "Re-run simulation focusing on categories where scores were lowest; compare your answers to the reference text in Q&A.",
  };
}

export async function summarizeInvestorSessionWithAi(
  answers: Array<{ question: string; userAnswer: string | null; score: number | null; aiFeedback: string | null }>,
): Promise<SessionSummary> {
  const base = buildTemplateSessionSummary(
    answers.map((a) => ({ score: a.score, aiFeedback: a.aiFeedback })),
  );
  if (!openai || !isOpenAiConfigured()) return base;

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return JSON only: {"strengths":"...","weaknesses":"...","recommendedImprovements":"..."} — 2-3 sentences each, investor-meeting coaching tone.',
        },
        {
          role: "user",
          content: JSON.stringify({ rounds: answers }),
        },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      averageScore: base.averageScore,
      strengths: String(p.strengths ?? base.strengths),
      weaknesses: String(p.weaknesses ?? base.weaknesses),
      recommendedImprovements: String(p.recommendedImprovements ?? base.recommendedImprovements),
    };
  } catch {
    return base;
  }
}
