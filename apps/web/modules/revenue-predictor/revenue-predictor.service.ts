import { STAGE_CLOSE_WEIGHT } from "./revenue-predictor.config";
import { buildSalespersonExplainability } from "./revenue-predictor-explainability.service";
import {
  buildCoachingUpliftForecast,
  buildForecastRangesCents,
  computeBaseExpectedRevenueCents,
  computeWeightedCloseProbability,
} from "./revenue-predictor-forecast.service";
import {
  buildPipelinePredictorInput,
  buildSalespersonPredictorInput,
} from "./revenue-predictor-inputs.service";
import {
  estimateOpportunityLoss,
  estimateRiskDownside,
} from "./revenue-predictor-opportunity-loss.service";
import type {
  PipelineForecastResult,
  PipelinePredictorFilters,
  PipelineStage,
  SalespersonRevenueForecast,
} from "./revenue-predictor.types";
import {
  loadRevenuePredictorStore,
  saveRevenuePredictorStore,
} from "./revenue-predictor-storage";
import { listSalesProfiles } from "@/modules/ai-sales-manager/ai-sales-profile.service";
import { evaluateRevenuePredictorAlerts } from "./revenue-predictor-alerts.service";
import { buildTeamRevenueForecast } from "./revenue-predictor-team.service";

const OPEN_STAGES: PipelineStage[] = ["NEW_LEAD", "CONTACTED", "DEMO_SCHEDULED", "QUALIFIED", "OFFER"];

/** Monthly-style label — operational only. */
export const REVENUE_FORECAST_PERIOD_LABEL = "Next 30 days (directional)";

export function buildSalespersonRevenueForecast(userId: string): SalespersonRevenueForecast {
  const input = buildSalespersonPredictorInput(userId);
  const weighted = computeWeightedCloseProbability(input);
  const base = computeBaseExpectedRevenueCents(input, weighted);
  const ranges = buildForecastRangesCents(base);
  const coaching = buildCoachingUpliftForecast(input, base);
  const risk = estimateRiskDownside(input, base);
  const explainability = buildSalespersonExplainability(input, weighted);

  const store = loadRevenuePredictorStore();
  store.lastRepForecastCents[userId] = ranges.baseCents;
  saveRevenuePredictorStore(store);

  return {
    userId,
    forecastPeriodLabel: REVENUE_FORECAST_PERIOD_LABEL,
    weightedCloseProbability: weighted,
    ranges,
    coachingUpliftCents: coaching.potentialUpliftCents,
    coachingUpliftPctBand: {
      low: coaching.upliftLowPct,
      high: coaching.upliftHighPct,
    },
    downsideRiskCents: risk.downsideCents,
    explainability: {
      ...explainability,
      coachingUpliftReason: coaching.narrative,
    },
    generatedAtIso: new Date().toISOString(),
  };
}

export function buildPipelineForecast(filters: PipelinePredictorFilters): PipelineForecastResult {
  const pipes = buildPipelinePredictorInput(filters);
  let stageProb = 0.22;
  const totalCounts = Object.entries(pipes.stageMix).reduce((s, [, v]) => s + v, 0);
  if (totalCounts > 0) {
    stageProb = 0;
    for (const st of OPEN_STAGES) {
      const c = pipes.stageMix[st] ?? 0;
      if (c <= 0) continue;
      stageProb += (c / totalCounts) * STAGE_CLOSE_WEIGHT[st];
    }
    stageProb = Math.min(0.72, Math.max(0.08, stageProb));
  }

  const expected = Math.round(pipes.totalPipelineCents * stageProb);
  const ranges = buildForecastRangesCents(expected);

  return {
    filters,
    totalPipelineCents: pipes.totalPipelineCents,
    expectedCloseWeightedCents: expected,
    ranges,
    explainability: {
      confidenceLabel: pipes.repCount >= 5 ? "MEDIUM" : "LOW",
      confidenceRationale:
        pipes.repCount < 3
          ? "Few snapshots contributing — treat pipeline rollup as exploratory."
          : "Pipeline aggregated from revenue snapshots stored in-browser until CRM wiring.",
      factorsIncreasing: pipes.totalPipelineCents > 0 ? ["Recorded pipeline dollars present for weighting."] : [],
      factorsReducing:
        pipes.totalPipelineCents <= 0 ? ["No pipeline captured in predictor store."] : [],
      stageConcentrationRisks: [],
    },
  };
}

export function buildOrganizationRevenueRollup(): {
  totalForecastBaseCents: number;
  ranges: ReturnType<typeof buildForecastRangesCents>;
  repCount: number;
  biggestLeakCents: number;
  biggestUpsideCents: number;
} {
  let total = 0;
  let leak = 0;
  let upside = 0;

  const profiles = listSalesProfiles();
  for (const pr of profiles) {
    const inp = buildSalespersonPredictorInput(pr.userId);
    const w = computeWeightedCloseProbability(inp);
    const base = computeBaseExpectedRevenueCents(inp, w);
    total += base;
    const coach = buildCoachingUpliftForecast(inp, base);
    upside = Math.max(upside, coach.potentialUpliftCents);
    leak = Math.max(leak, estimateOpportunityLoss(inp).estimatedLostRevenueCents);
  }

  return {
    totalForecastBaseCents: total,
    ranges: buildForecastRangesCents(total),
    repCount: profiles.length,
    biggestLeakCents: leak,
    biggestUpsideCents: upside,
  };
}

/** Admin Super Dashboard + mobile-friendly snapshot. */
export function getRevenuePredictorAdminSummary() {
  const rollup = buildOrganizationRevenueRollup();
  const alerts = evaluateRevenuePredictorAlerts().slice(0, 10);
  return {
    generatedAtIso: new Date().toISOString(),
    totalForecastBaseCents: rollup.totalForecastBaseCents,
    conservativeCents: rollup.ranges.conservativeCents,
    baseCents: rollup.ranges.baseCents,
    upsideCents: rollup.ranges.upsideCents,
    repCount: rollup.repCount,
    biggestLeakCents: rollup.biggestLeakCents,
    biggestUpsideCents: rollup.biggestUpsideCents,
    alertsPreview: alerts.map((a) => ({
      kind: a.kind,
      title: a.title,
      severity: a.severity,
    })),
  };
}

export function buildMobileRevenueUserSummary(userId: string) {
  const prevBase = loadRevenuePredictorStore().lastRepForecastCents[userId];
  const f = buildSalespersonRevenueForecast(userId);
  const delta =
    prevBase !== undefined && prevBase > 0 ? (f.ranges.baseCents - prevBase) / prevBase : null;
  return {
    userId,
    baseForecastCents: f.ranges.baseCents,
    conservativeCents: f.ranges.conservativeCents,
    upsideCents: f.ranges.upsideCents,
    weightedCloseProbability: f.weightedCloseProbability,
    coachingUpliftCents: f.coachingUpliftCents,
    downsideRiskCents: f.downsideRiskCents,
    confidenceLabel: f.explainability.confidenceLabel,
    forecastDeltaPct: delta !== null ? Math.round(delta * 1000) / 10 : null,
    riskIndicators: f.explainability.stageConcentrationRisks.slice(0, 3),
    biggestUpsideReason: f.explainability.coachingUpliftReason ?? f.explainability.factorsIncreasing[0] ?? "",
  };
}

export function buildMobileRevenueTeamSummary(teamId: string) {
  const tf = buildTeamRevenueForecast(teamId);
  if (!tf) return null;
  return {
    teamId,
    baseForecastCents: tf.ranges.baseCents,
    conservativeCents: tf.ranges.conservativeCents,
    upsideCents: tf.ranges.upsideCents,
    coachingUpliftAggregateCents: tf.coachingUpliftCentsAggregate,
    confidenceLabel: tf.explainability.confidenceLabel,
    memberCount: tf.memberForecasts.length,
  };
}
