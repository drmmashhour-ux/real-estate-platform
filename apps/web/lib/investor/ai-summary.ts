import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildInvestorPrompt } from "@/lib/ai/investor";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { assertComputedMetricsForAiSummary, assertNoGuaranteedReturnLanguage } from "@/lib/investor/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.INVESTOR_ANALYSIS_AI_MODEL?.trim() || "gpt-4o-mini";

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

export async function generateInvestorSummary(caseId: string, actorUserId: string) {
  const row = await prisma.investorAnalysisCase.findUnique({
    where: { id: caseId },
  });

  if (!row) throw new Error("INVESTOR_CASE_NOT_FOUND");

  assertComputedMetricsForAiSummary(row);

  const prompt = buildInvestorPrompt({
    title: row.title,
    propertyType: row.propertyType,
    purchasePriceCents: row.purchasePriceCents,
    monthlyCashflowCents: row.monthlyCashflowCents,
    capRate: row.capRate,
    cashOnCashReturn: row.cashOnCashReturn,
    roiPercent: row.roiPercent,
    dscr: row.dscr,
    breakEvenOccupancy: row.breakEvenOccupancy,
  });

  let summary: string | null = null;
  let strengths: string[] = [];
  let risks: string[] = ["Verify all assumptions with current leases, taxes, and lender terms."];
  let investorTake: string | null = null;

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
            "You output only valid JSON. Never promise returns or guaranteed profit. AI assists underwriting only.",
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
      investorTake = typeof parsed.investorTake === "string" ? parsed.investorTake : null;
    }
  } else {
    summary =
      "OpenAI is not configured — set OPENAI_API_KEY for narrative analysis. Computed cap rate, cashflow, DSCR, and break-even are shown numerically above.";
    strengths = [];
    if (row.capRate != null) strengths.push(`Indicative cap rate ${(row.capRate * 100).toFixed(2)}% (NOI-based, model inputs).`);
    if (row.dscr != null) strengths.push(`DSCR (NOI / debt service): ${row.dscr.toFixed(2)}`);
  }

  if (summary) assertNoGuaranteedReturnLanguage(summary);
  if (investorTake) assertNoGuaranteedReturnLanguage(investorTake);

  const prev =
    row.assumptions && typeof row.assumptions === "object" && !Array.isArray(row.assumptions) ?
      (row.assumptions as Record<string, unknown>)
    : {};

  const updated = await prisma.investorAnalysisCase.update({
    where: { id: caseId },
    data: {
      aiSummary: summary,
      assumptions: {
        ...prev,
        strengths,
        risks,
        investorTake: investorTake ?? "",
      } as Prisma.InputJsonValue,
    },
  });

  await recordAuditEvent({
    actorUserId,
    action: "INVESTOR_AI_SUMMARY_GENERATED",
    payload: { caseId, openAi: isOpenAiConfigured() },
  });

  return updated;
}
