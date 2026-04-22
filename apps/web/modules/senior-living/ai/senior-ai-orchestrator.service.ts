/**
 * Master coordinator — hides complexity; returns minimal UI payloads.
 */
import { prisma } from "@/lib/db";
import { logSeniorAi } from "@/lib/senior-ai/log";
import { listResidences } from "../residence.service";
import type { MatchingEngineRow, SeniorAiProfileInput, UiExplanationPack } from "./senior-ai.types";
import { inferMissingNeeds } from "./senior-intent.service";
import { computeDisplayScore, computeRankingScore } from "./senior-ranking.engine";
import { explainMatchForFamily } from "./senior-explainer.service";
import { scoreResidenceMatch, type ResidenceMatchInput } from "./senior-matching.engine";
import { recordAiLearningEvent, updateLearningFromOutcomes } from "./senior-learning.service";
import { computeAreaScore, upsertAreaInsight } from "./senior-heatmap.service";
import type { IntentSignals } from "./senior-intent.service";
import { seniorAiCreateFromMatchProfile } from "../senior-match-ai-bridge";

/**
 * Resolves `profileId` from either a `SeniorAiProfile` id or a legacy `SeniorMatchProfile` id
 * (same id is used in the family results URL). Creates a linked AI profile for old match-only rows.
 */
export async function resolveSeniorAiProfileId(profileId: string): Promise<string> {
  const byId = await prisma.seniorAiProfile.findUnique({ where: { id: profileId } });
  if (byId) return byId.id;
  const linked = await prisma.seniorAiProfile.findUnique({
    where: { seniorMatchProfileId: profileId },
  });
  if (linked) return linked.id;
  const mp = await prisma.seniorMatchProfile.findUnique({ where: { id: profileId } });
  if (!mp) throw new Error("Profile not found");
  const created = await prisma.seniorAiProfile.create({
    data: seniorAiCreateFromMatchProfile(mp),
  });
  logSeniorAi("[senior-ai]", "backfill_senior_ai_profile", { matchProfileId: profileId, id: created.id });
  return created.id;
}

export async function buildProfileFromInputs(input: SeniorAiProfileInput): Promise<{ id: string }> {
  const row = await prisma.seniorAiProfile.create({
    data: {
      sessionId: input.sessionId ?? undefined,
      userId: input.userId ?? undefined,
      whoFor: input.whoFor ?? undefined,
      ageBand: input.ageBand ?? undefined,
      mobilityLevel: input.mobilityLevel ?? undefined,
      careNeedLevel: input.careNeedLevel ?? undefined,
      memorySupportNeeded: input.memorySupportNeeded ?? false,
      medicalSupportNeeded: input.medicalSupportNeeded ?? false,
      mealSupportNeeded: input.mealSupportNeeded ?? false,
      socialActivityPriority: input.socialActivityPriority ?? false,
      budgetBand: input.budgetBand ?? undefined,
      preferredCity: input.preferredCity ?? undefined,
      preferredArea: input.preferredArea ?? undefined,
      languagePreference: input.languagePreference ?? undefined,
      urgencyLevel: input.urgencyLevel ?? undefined,
      profileConfidence: 0.5,
    },
  });
  logSeniorAi("[senior-ai]", "profile_created", { id: row.id });
  return { id: row.id };
}

export function inferProfileWithIntent(
  partial: SeniorAiProfileInput,
  signals: IntentSignals,
): ReturnType<typeof inferMissingNeeds> {
  return inferMissingNeeds(partial, signals);
}

export async function generateMatches(profileId: string): Promise<
  Array<{
    residenceId: string;
    displayScore: number;
    explanation: UiExplanationPack;
    row: MatchingEngineRow;
  }>
> {
  const resolvedId = await resolveSeniorAiProfileId(profileId);
  const profileRow = await prisma.seniorAiProfile.findUnique({ where: { id: resolvedId } });
  if (!profileRow) throw new Error("Profile not found");

  const profile: SeniorAiProfileInput = {
    whoFor: profileRow.whoFor,
    ageBand: profileRow.ageBand,
    mobilityLevel: profileRow.mobilityLevel,
    careNeedLevel: profileRow.careNeedLevel,
    memorySupportNeeded: profileRow.memorySupportNeeded,
    medicalSupportNeeded: profileRow.medicalSupportNeeded,
    mealSupportNeeded: profileRow.mealSupportNeeded,
    socialActivityPriority: profileRow.socialActivityPriority,
    budgetBand: profileRow.budgetBand,
    preferredCity: profileRow.preferredCity,
    preferredArea: profileRow.preferredArea,
    languagePreference: profileRow.languagePreference,
    urgencyLevel: profileRow.urgencyLevel,
  };

  const residences = await listResidences({
    city: profileRow.preferredCity?.trim() || undefined,
    take: 60,
  });

  const perfRows = await prisma.seniorOperatorPerformance.findMany({
    where: { residenceId: { in: residences.map((r) => r.id) } },
  });
  const perfMap = new Map(perfRows.map((p) => [p.residenceId, p]));

  const scored: Array<{
    residenceId: string;
    displayScore: number;
    rankingScore: number;
    explanation: UiExplanationPack;
    row: MatchingEngineRow;
  }> = [];

  for (const r of residences) {
    const resInput: ResidenceMatchInput = {
      id: r.id,
      careLevel: r.careLevel,
      city: r.city,
      basePrice: r.basePrice,
      priceRangeMin: r.priceRangeMin,
      priceRangeMax: r.priceRangeMax,
      verified: r.verified,
      has24hStaff: r.has24hStaff,
      mealsIncluded: r.mealsIncluded,
      medicalSupport: r.medicalSupport,
      activitiesIncluded: r.activitiesIncluded,
      unitsAvailable: r.units.filter((u) => u.available).length,
    };

    const row = scoreResidenceMatch(profile, resInput);
    const perf = perfMap.get(r.id);
    const trust =
      perf?.trustScore != null ? Math.min(1, perf.trustScore > 1 ? perf.trustScore / 100 : perf.trustScore)
      : r.verified ? 0.85
      : 0.55;
    const ranking = computeRankingScore({
      responseTimeAvgHours: perf?.responseTimeAvg ?? null,
      leadAcceptanceRate: perf?.leadAcceptanceRate ?? null,
      visitRate: perf?.visitRate ?? null,
      conversionRate: perf?.conversionRate ?? null,
      profileCompleteness: perf?.profileCompleteness ?? null,
      trustScore: trust,
      coldStart: perf == null,
    });
    const displayScore = computeDisplayScore(row.baseScore, ranking);
    const explanation = explainMatchForFamily(profile, row, { city: r.city, verified: r.verified });

    scored.push({ residenceId: r.id, displayScore, rankingScore: ranking, explanation, row });
  }

  scored.sort((a, b) => b.displayScore - a.displayScore);
  const top = scored.slice(0, 15);

  for (const item of top) {
    await prisma.seniorMatchingResult.create({
      data: {
        profileId: resolvedId,
        residenceId: item.residenceId,
        baseMatchScore: item.row.baseScore,
        rankingScore: item.rankingScore,
        finalScore: item.displayScore,
        explanationJson: item.explanation as object,
      },
    });
  }

  logSeniorAi("[senior-ai]", "matches_generated", { profileId: resolvedId, n: top.length });
  return top;
}

export async function rerankMatches(
  profileId: string,
  matches: Array<{ residenceId: string; displayScore: number }>,
): Promise<Array<{ residenceId: string; displayScore: number }>> {
  void profileId;
  return [...matches].sort((a, b) => b.displayScore - a.displayScore);
}

export async function explainResults(
  profileId: string,
  matches: Array<{ residenceId: string }>,
): Promise<{ summary: string }> {
  void profileId;
  return {
    summary: `Here are ${matches.length} places that may fit — tap one to learn more.`,
  };
}

export async function scoreLead(leadId: string): Promise<{ ok: boolean }> {
  const { scoreLeadWithAiLayer } = await import("./senior-lead-scoring.service");
  await scoreLeadWithAiLayer(leadId);
  return { ok: true };
}

export async function generateBestNextAction(): Promise<{ action: string }> {
  return { action: "Review your top match and request a visit when ready." };
}

export async function updateLearning(): Promise<{ ok: boolean; message: string }> {
  return updateLearningFromOutcomes();
}

export async function computeAreaInsights(city: string): Promise<{ ok: boolean }> {
  const residences = await listResidences({ city, take: 80 });
  const score = computeAreaScore({
    city,
    concentrationOfGoodMatches: Math.min(1, residences.length / 40),
    averageOperatorPerformance: 0.65,
    recentConversionStrength: 0.55,
    priceFitDensity: 0.6,
  });
  await upsertAreaInsight({
    city,
    areaLabel: `${city} core`,
    areaScore: score,
    activeResidences: residences.length,
  });
  await recordAiLearningEvent({ eventType: "AREA_INSIGHT_REFRESH", metadata: { city } });
  return { ok: true };
}
