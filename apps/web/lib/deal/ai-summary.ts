import { prisma } from "@/lib/db";
import { buildDealPrompt } from "@/lib/ai/deal";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { assertBuyBoxAiLanguageSafe } from "@/lib/buybox/safety";
import { assertDealMetricsPresent } from "@/lib/deal/safety";

const MODEL = process.env.DEAL_FINDER_AI_MODEL?.trim() || "gpt-4o-mini";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export async function generateDealCandidateSummary(dealCandidateId: string) {
  const deal = await prisma.dealCandidate.findUnique({
    where: { id: dealCandidateId },
  });

  if (!deal) throw new Error("DEAL_CANDIDATE_NOT_FOUND");

  assertDealMetricsPresent({
    askingPriceCents: deal.askingPriceCents,
    dealScore: deal.dealScore,
    capRate: deal.capRate,
  });

  const prompt = buildDealPrompt({
    deal,
    note: "Outputs must not promise returns or suggest automatic purchases.",
  });

  let summary: string | null = null;
  let strengths: string[] = [];
  let risks: string[] = [
    deal.lowConfidence ?
      "Low data confidence — treat metrics as illustrative until appraisal and rent are verified."
    : "Model scores are not a substitute for underwriting and legal diligence.",
  ];
  let investorFit: string | null = null;

  const client = openai;
  if (isOpenAiConfigured() && client) {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You output only valid JSON. Never promise returns, guaranteed profit, or autonomous purchases. Flag uncertainty when inputs are heuristic.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    if (raw) {
      const cleaned = stripJsonFences(raw);
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      summary = typeof parsed.summary === "string" ? parsed.summary : null;
      strengths = asStringArray(parsed.strengths);
      risks = asStringArray(parsed.risks).length ? asStringArray(parsed.risks) : risks;
      investorFit = typeof parsed.investorFit === "string" ? parsed.investorFit : null;
    }
  } else {
    summary =
      "OpenAI is not configured — set OPENAI_API_KEY for narrative analysis. Deterministic score and labels are still available on the row.";
    strengths = [
      ...(deal.dealLabel ? [`Label: ${deal.dealLabel}`] : []),
      ...(deal.dealScore != null ? [`Model score: ${Math.round(deal.dealScore)}`] : []),
    ];
  }

  if (summary) assertBuyBoxAiLanguageSafe(summary);
  if (investorFit) assertBuyBoxAiLanguageSafe(investorFit);

  const narrative = [summary, investorFit ? `Fit: ${investorFit}` : "", strengths.join("; "), risks.join("; ")]
    .filter(Boolean)
    .join("\n\n");

  return prisma.dealCandidate.update({
    where: { id: deal.id },
    data: {
      aiSummary: narrative || summary,
    },
  });
}
