import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildBuyBoxPrompt } from "@/lib/ai/buybox";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { assertBuyBoxAiLanguageSafe, assertMatchRationalePresent } from "@/lib/buybox/safety";
import { dealViewFromFsbo } from "@/lib/buybox/scoring";

const MODEL = process.env.BUY_BOX_AI_MODEL?.trim() || "gpt-4o-mini";

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

export async function generateBuyBoxMatchSummary(matchId: string) {
  const match = await prisma.buyBoxMatch.findUnique({
    where: { id: matchId },
    include: { investorBuyBox: true },
  });

  if (!match?.investorBuyBox) throw new Error("BUY_BOX_MATCH_NOT_FOUND");

  assertMatchRationalePresent(match.rationale);

  const listing = match.listingId
    ? await prisma.fsboListing.findUnique({
        where: { id: match.listingId },
        include: { metrics: true },
      })
    : null;

  if (!listing) throw new Error("BUY_BOX_LISTING_NOT_FOUND");

  const deal = dealViewFromFsbo(listing, listing.metrics);

  const prompt = buildBuyBoxPrompt({
    buyBox: match.investorBuyBox,
    deal,
    rationale: match.rationale,
  });

  let summary: string | null = null;
  let strengths: string[] = [];
  let risks: string[] = ["Model uses partial signals; confirm with underwriting and diligence."];
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
            "You output only valid JSON for buy-box explanations. Never promise returns or suggest autonomous purchases.",
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
      "OpenAI is not configured — showing deterministic rationale only. Set OPENAI_API_KEY for narrative fit analysis.";
    strengths = ((match.rationale as { reasons?: string[] } | null)?.reasons ?? []).slice(0, 6);
  }

  if (summary) assertBuyBoxAiLanguageSafe(summary);
  if (investorFit) assertBuyBoxAiLanguageSafe(investorFit);

  const prev = (match.rationale && typeof match.rationale === "object" && !Array.isArray(match.rationale) ?
      (match.rationale as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  return prisma.buyBoxMatch.update({
    where: { id: match.id },
    data: {
      aiSummary: summary,
      rationale: {
        ...prev,
        strengths,
        risks,
        investorFit: investorFit ?? "",
        aiGeneratedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}
