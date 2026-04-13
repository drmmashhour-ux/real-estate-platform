import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type InvestorAnswerEvaluation = {
  score: number;
  feedback: string;
  improvedAnswer: string;
  clarity: number;
  credibility: number;
  completeness: number;
  confidence: number;
};

const MODEL = process.env.INVESTOR_EVAL_MODEL?.trim() || "gpt-4o-mini";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function heuristicEvaluate(input: {
  question: string;
  referenceAnswer: string;
  userAnswer: string;
}): InvestorAnswerEvaluation {
  const u = input.userAnswer.trim();
  const len = u.length;
  const words = u.split(/\s+/).filter(Boolean).length;
  let base = 45;
  if (len > 40) base += 10;
  if (len > 120) base += 10;
  if (words > 25) base += 8;
  const refLower = input.referenceAnswer.toLowerCase();
  const overlap = refLower.split(/\s+/).filter((w) => w.length > 4 && u.toLowerCase().includes(w)).length;
  base += clamp(overlap * 3, 0, 15);
  const score = clamp(Math.round(base), 0, 92);

  const clarity = clamp(Math.round(55 + (words > 15 ? 20 : 0) + (len > 80 ? 15 : 0)), 0, 100);
  const credibility = clamp(Math.round(50 + overlap * 5), 0, 100);
  const completeness = clamp(Math.round(45 + (words > 20 ? 25 : 10)), 0, 100);
  const confidence = clamp(Math.round(50 + (len > 60 ? 20 : 0)), 0, 100);

  return {
    score,
    feedback:
      "Offline evaluation (no OpenAI key): aim for 3–5 sentences, name specifics (market, metric, wedge), and tie back to the question. Compare your draft to the reference answer for missing proof points.",
    improvedAnswer:
      u.length > 0
        ? `${u}\n\n— Add one concrete metric or example and a clear takeaway in one sentence.`
        : "Draft a concise answer: context → proof → implication.",
    clarity,
    credibility,
    completeness,
    confidence,
  };
}

/**
 * Scores a founder practice answer vs. the canonical investor Q&A row (and optional AI rubric).
 */
export async function evaluateInvestorAnswer(input: {
  question: string;
  referenceAnswer: string;
  userAnswer: string;
  category?: string;
}): Promise<InvestorAnswerEvaluation> {
  const userAnswer = input.userAnswer.trim();
  if (!userAnswer) {
    return {
      score: 0,
      feedback: "No answer provided.",
      improvedAnswer: input.referenceAnswer.slice(0, 500),
      clarity: 0,
      credibility: 0,
      completeness: 0,
      confidence: 0,
    };
  }

  if (!openai || !isOpenAiConfigured()) {
    return heuristicEvaluate({
      question: input.question,
      referenceAnswer: input.referenceAnswer,
      userAnswer,
    });
  }

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You evaluate founder answers to investor diligence questions. Return ONLY valid JSON with keys: score (0-100 integer), feedback (string, 2-4 sentences), improvedAnswer (string, concise rewrite combining best of user + reference), clarity (0-100), credibility (0-100), completeness (0-100), confidence (0-100). Be fair: reward structure and specifics; penalize hand-waving.",
        },
        {
          role: "user",
          content: JSON.stringify({
            category: input.category ?? "general",
            question: input.question,
            referenceAnswer: input.referenceAnswer,
            userAnswer,
          }),
        },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const score = clamp(Number(parsed.score) || 0, 0, 100);
    return {
      score,
      feedback: String(parsed.feedback ?? "Review the suggested improved answer."),
      improvedAnswer: String(parsed.improvedAnswer ?? input.referenceAnswer).slice(0, 4000),
      clarity: clamp(Number(parsed.clarity) || score, 0, 100),
      credibility: clamp(Number(parsed.credibility) || score, 0, 100),
      completeness: clamp(Number(parsed.completeness) || score, 0, 100),
      confidence: clamp(Number(parsed.confidence) || score, 0, 100),
    };
  } catch {
    return heuristicEvaluate({
      question: input.question,
      referenceAnswer: input.referenceAnswer,
      userAnswer,
    });
  }
}
