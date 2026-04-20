/**
 * Aggregates read-only platform signals for adaptive suggestions — no side effects.
 */

import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildBrokerLockInSignals } from "@/modules/brokers/broker-lockin.service";
import type { AdaptiveConfidence, AdaptiveContext } from "@/modules/growth/adaptive-intelligence.types";
import { getClosingTactics } from "@/modules/growth/closing-psychology.service";
import { buildExecutionPlan } from "@/modules/growth/execution-planner.service";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { buildRevenueForecast } from "@/modules/growth/revenue-forecast.service";
import { getBestActionTiming } from "@/modules/growth/timing-optimizer.service";

function pickWeakestStage(
  groups: { pipelineStage: string; _count: number }[],
): { stage: string; count: number } | undefined {
  const early = ["new", "contacted", "qualified", "follow_up"];
  let best: { stage: string; count: number } | undefined;
  for (const g of groups) {
    if (!early.includes(g.pipelineStage)) continue;
    if (!best || g._count > best.count) best = { stage: g.pipelineStage, count: g._count };
  }
  return best;
}

function hottestCityFromLeads(
  rows: { fsboListing: { city: string } | null }[],
): { city: string; count: number } | undefined {
  const m = new Map<string, number>();
  for (const r of rows) {
    const c = r.fsboListing?.city?.trim();
    if (!c) continue;
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  let top: { city: string; count: number } | undefined;
  for (const [city, count] of m) {
    if (!top || count > top.count) top = { city, count };
  }
  return top;
}

export async function buildAdaptiveContext(): Promise<AdaptiveContext> {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 86400000);
  const fourteenAgo = new Date(now.getTime() - 14 * 86400000);

  const [
    topLeadRow,
    stageGroups,
    fsboLeads,
    leadCount14,
    won14,
    lockSignals,
    plan,
    executionResults,
    revenueForecast,
  ] = await Promise.all([
    prisma.lead.findFirst({
      orderBy: { score: "desc" },
      select: { score: true, pipelineStage: true, updatedAt: true },
    }),
    prisma.lead.groupBy({ by: ["pipelineStage"], _count: true }),
    prisma.lead.findMany({
      where: { fsboListingId: { not: null }, createdAt: { gte: thirtyAgo } },
      select: { fsboListing: { select: { city: true } } },
      take: 2000,
    }),
    prisma.lead.count({ where: { createdAt: { gte: fourteenAgo } } }),
    prisma.lead.count({
      where: { pipelineStage: "won", updatedAt: { gte: fourteenAgo } },
    }),
    buildBrokerLockInSignals().catch(() => []),
    engineFlags.executionPlannerV1
      ? buildExecutionPlan(14).catch(() => null)
      : Promise.resolve(null),
    engineFlags.growthExecutionResultsV1
      ? buildGrowthExecutionResultsSummary(14).catch(() => null)
      : Promise.resolve(null),
    engineFlags.revenueForecastV1 ? buildRevenueForecast(14).catch(() => null) : Promise.resolve(null),
  ]);

  const timing = getBestActionTiming();
  const critical = timing.find((t) => t.urgency === "critical");
  const highT = timing.find((t) => t.urgency === "high");
  const bestLine = critical ?? highT ?? timing[0];
  const timingUrgencyHint = critical ? "critical" : highT ? "high" : "standard";

  const topLead =
    topLeadRow != null
      ? {
          score: topLeadRow.score,
          pipelineStage: topLeadRow.pipelineStage,
          hoursSinceTouch: Math.max(0, (now.getTime() - topLeadRow.updatedAt.getTime()) / 3600000),
        }
      : undefined;

  const cityInfo = hottestCityFromLeads(fsboLeads);
  const weak = pickWeakestStage(stageGroups);

  const dep = lockSignals
    .map((s) => ({ score: s.dependencyScore, tier: s.tier }))
    .sort((a, b) => b.score - a.score)[0];

  const brokerDependencySignals = lockSignals.slice(0, 6).map(
    (s) =>
      `${s.tier} tier · dependency composite ${Math.round(s.dependencyScore * 100)}% (derived from CRM monetization summaries)`,
  );

  let executionStatus = engineFlags.executionPlannerV1 ? "Planner disabled or unavailable for this snapshot." : "Execution planner flag off.";
  if (plan) {
    executionStatus = `${plan.todayTasks.length} today / ${plan.weeklyTasks.length} weekly suggested tasks; ${plan.blockedTasks.length} blocked (see execution planner).`;
  }

  const tactics = getClosingTactics("aggregate");
  const closingPsychologyAxis = tactics[(now.getDate() - 1) % tactics.length]?.trigger;

  const totalStages = stageGroups.reduce((a, g) => a + g._count, 0);
  const pipelineStatus = `${leadCount14} leads created in last 14d · ${won14} won updates in-window · ${totalStages} total CRM rows in stage rollup`;

  const revenueSignalSummary =
    leadCount14 > 0
      ? `Illustrative pipeline: ${won14} closed-won touch(es) vs ${leadCount14} new leads (14d) — correlational only, not revenue recognition.`
      : "Sparse lead creation in the last 14d — growth signals are thin.";

  const sparseSignals = totalStages < 5 && leadCount14 < 3;

  let dealPerformance: AdaptiveContext["dealPerformance"];
  if (executionResults) {
    const sparseAiTelemetry = executionResults.sparseDataWarnings.some((w) =>
      /sparse|thin/i.test(w),
    );
    dealPerformance = {
      windowDays: executionResults.windowDays,
      aiRows: executionResults.aiAssistResults.length,
      aiPositiveBands: executionResults.aiAssistResults.filter((r) => r.outcomeBand === "positive").length,
      sparseAiTelemetry,
      brokerRows: executionResults.brokerCompetitionResults.length,
      brokerPositiveBands: executionResults.brokerCompetitionResults.filter((r) => r.outcomeBand === "positive")
        .length,
    };
  }

  let revenueForecastConfidence: AdaptiveConfidence | undefined;
  let revenueForecastInsufficientData: boolean | undefined;
  if (revenueForecast) {
    revenueForecastConfidence = revenueForecast.meta.confidence as AdaptiveConfidence;
    revenueForecastInsufficientData = revenueForecast.meta.insufficientData;
  }

  return {
    generatedAt: now.toISOString(),
    topLead,
    hottestCity: cityInfo?.city,
    hottestCityLeadCount: cityInfo?.count,
    weakestStage: weak,
    bestTimingWindow: bestLine ? `${bestLine.recommendation} (urgency: ${bestLine.urgency})` : undefined,
    timingUrgencyHint,
    brokerDependencySignals,
    highestBrokerDependency: dep ? { score: dep.score, tier: dep.tier } : undefined,
    pipelineStatus,
    executionStatus,
    closingPsychologyAxis,
    revenueSignalSummary,
    dealPerformance,
    revenueForecastConfidence,
    revenueForecastInsufficientData,
    sparseSignals,
  };
}
