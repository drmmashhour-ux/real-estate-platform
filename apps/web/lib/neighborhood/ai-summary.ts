import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildNeighborhoodPrompt } from "@/lib/ai/neighborhood";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { assertNeighborhoodScoreInputsForAi, assertNoGuaranteedNeighborhoodOutcomeLanguage } from "@/lib/neighborhood/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const MODEL = process.env.NEIGHBORHOOD_AI_MODEL?.trim() || "gpt-4o-mini";

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

export async function generateNeighborhoodSummary(neighborhoodProfileId: string, actorUserId: string) {
  const profile = await prisma.neighborhoodProfile.findUnique({
    where: { id: neighborhoodProfileId },
  });

  if (!profile) throw new Error("NEIGHBORHOOD_PROFILE_NOT_FOUND");

  assertNeighborhoodScoreInputsForAi(profile);

  const metrics =
    profile.metrics && typeof profile.metrics === "object" && !Array.isArray(profile.metrics) ?
      (profile.metrics as Record<string, unknown>)
    : {};

  const prompt = buildNeighborhoodPrompt({
    neighborhoodName: profile.neighborhoodName,
    city: profile.city,
    scores: {
      scoreOverall: profile.scoreOverall,
      scoreDemand: profile.scoreDemand,
      scoreValue: profile.scoreValue,
      scoreYield: profile.scoreYield,
      scoreRisk: profile.scoreRisk,
      trendDirection: profile.trendDirection,
      investmentZone: profile.investmentZone,
    },
    metrics,
  });

  let summary: string | null = null;
  let strengths: string[] = [];
  let risks: string[] = [
    metrics.lowConfidence ?
      "Low comparable depth — treat scores as directional only until more sales/rent evidence is loaded."
    : "Model scores are not a substitute for boots-on-the-ground market verification.",
  ];
  let investorAngle: string | null = null;

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
            "You output only valid JSON. Never promise investment outcomes. Flag data weakness when comparableCount is low.",
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
      investorAngle = typeof parsed.investorAngle === "string" ? parsed.investorAngle : null;
    }
  } else {
    summary =
      "OpenAI is not configured — set OPENAI_API_KEY for narrative neighborhood intelligence. Deterministic scores are still available on this profile.";
    strengths = [];
    if (profile.investmentZone) strengths.push(`Model zone: ${profile.investmentZone}`);
  }

  if (summary) assertNoGuaranteedNeighborhoodOutcomeLanguage(summary);
  if (investorAngle) assertNoGuaranteedNeighborhoodOutcomeLanguage(investorAngle);

  const updated = await prisma.neighborhoodProfile.update({
    where: { id: profile.id },
    data: {
      aiSummary: summary,
      metrics: {
        ...metrics,
        strengths,
        risks,
        investorAngle: investorAngle ?? "",
      } as Prisma.InputJsonValue,
    },
  });

  await recordAuditEvent({
    actorUserId,
    action: "NEIGHBORHOOD_AI_SUMMARY_GENERATED",
    payload: { neighborhoodProfileId: profile.id, city: profile.city, neighborhoodKey: profile.neighborhoodKey },
  });

  return updated;
}
