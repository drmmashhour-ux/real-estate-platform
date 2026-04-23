import { listSalesProfiles } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { getTeam, listTeamMembers } from "@/modules/team-training/team.service";

import { buildSalespersonPredictorInput, buildTeamPredictorInput } from "./revenue-predictor-inputs.service";
import {
  buildCoachingUpliftForecast,
  buildForecastRangesCents,
  computeBaseExpectedRevenueCents,
  computeWeightedCloseProbability,
} from "./revenue-predictor-forecast.service";
import { estimateRiskDownside } from "./revenue-predictor-opportunity-loss.service";
import type { RevenueExplainability, TeamRevenueForecast } from "./revenue-predictor.types";
import { loadRevenuePredictorStore, saveRevenuePredictorStore } from "./revenue-predictor-storage";

export function buildTeamRevenueForecast(teamId: string): TeamRevenueForecast | null {
  const teamInput = buildTeamPredictorInput(teamId);
  if (!teamInput) return null;

  let sumBase = 0;
  let upliftSum = 0;
  const memberForecasts: TeamRevenueForecast["memberForecasts"] = [];

  for (const memberId of teamInput.memberIds) {
    const inp = buildSalespersonPredictorInput(memberId);
    const p = computeWeightedCloseProbability(inp);
    const base = computeBaseExpectedRevenueCents(inp, p);
    sumBase += base;
    const uplift = buildCoachingUpliftForecast(inp, base);
    upliftSum += uplift.potentialUpliftCents;
    const risk = estimateRiskDownside(inp, base);
    const badge = risk.downsideCents > base * 0.35 ? "high" : risk.downsideCents > base * 0.2 ? "med" : "low";
    memberForecasts.push({
      userId: memberId,
      displayName: inp.displayName,
      baseCents: base,
      riskBadge: badge,
    });
  }

  const ranges = buildForecastRangesCents(sumBase);

  const explainability: RevenueExplainability = {
    confidenceLabel:
      teamInput.memberIds.length >= 4 &&
      teamInput.totalPipelineValueCents > 0 &&
      teamInput.teamCloseRate > 0.12
        ? "MEDIUM"
        : "LOW",
    confidenceRationale:
      teamInput.memberIds.length < 2
        ? "Sparse team roster for revenue blending."
        : "Team rollup sums independent rep forecasts — watch for duplicated pipeline across members.",
    factorsIncreasing:
      teamInput.teamAverageCallScore >= 68 ? ["Aggregate call/training scores tolerable vs baseline."] : [],
    factorsReducing:
      teamInput.teamCloseRate < 0.15 ? ["Team historical close rate soft — tighten qualification."] : [],
    stageConcentrationRisks: ["Verify pipeline not double-counted across reps in CRM."],
  };

  const store = loadRevenuePredictorStore();
  store.lastTeamForecastCents[teamId] = ranges.baseCents;
  saveRevenuePredictorStore(store);

  return {
    teamId,
    ranges,
    coachingUpliftCentsAggregate: upliftSum,
    explainability,
    memberForecasts: memberForecasts.sort((a, b) => b.baseCents - a.baseCents),
    generatedAtIso: new Date().toISOString(),
  };
}

/** Rank coaching targets by uplift × pipeline proxy (explainable heuristic). */
export function rankCoachingByRevenueImpact(teamId?: string): { userId: string; score: number; note: string }[] {
  let userIds = listSalesProfiles().map((p) => p.userId);
  if (teamId) {
    const team = getTeam(teamId);
    if (!team) return [];
    userIds = listTeamMembers(teamId).map((m) => m.memberId);
  }

  const rows = userIds.map((userIdStr) => {
    const inp = buildSalespersonPredictorInput(userIdStr);
    const prob = computeWeightedCloseProbability(inp);
    const base = computeBaseExpectedRevenueCents(inp, prob);
    const uplift = buildCoachingUpliftForecast(inp, base);
    const score = uplift.potentialUpliftCents + Math.round(base * 0.05);
    return {
      userId: userIdStr,
      score,
      note: uplift.narrative.slice(0, 140),
    };
  });

  return rows.sort((a, b) => b.score - a.score).slice(0, 20);
}
