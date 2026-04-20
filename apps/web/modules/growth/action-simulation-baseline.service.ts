/**
 * Read-only baseline for action simulation — uses real stored metrics only; no writes.
 * Missing metrics stay undefined + warnings — never synthesize numbers to look complete.
 */

import { PlatformRole } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildBrokerLockInSignals } from "@/modules/brokers/broker-lockin.service";
import { buildCapitalAllocationPlan } from "@/modules/growth/capital-allocation.service";
import type { SimulationBaseline, ActionSimulationContext } from "@/modules/growth/action-simulation.types";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { buildFastDealSummary } from "@/modules/growth/fast-deal-results.service";
import { buildRevenueForecast } from "@/modules/growth/revenue-forecast.service";
import { buildWeeklyReviewSummary } from "@/modules/growth/weekly-review.service";

const DEFAULT_WINDOW = 14;

function minConfidence(
  a: SimulationBaseline["confidence"],
  b: SimulationBaseline["confidence"],
): SimulationBaseline["confidence"] {
  const o = { low: 0, medium: 1, high: 2 };
  return o[a] <= o[b] ? a : b;
}

/**
 * Aggregates leads, supply, and measured systems to ground scenario sims.
 * Omits any field that would require inventing a number.
 */
export async function buildSimulationBaseline(
  context: ActionSimulationContext = { windowDays: DEFAULT_WINDOW },
): Promise<SimulationBaseline> {
  const windowDays = Math.min(45, Math.max(7, context.windowDays || DEFAULT_WINDOW));
  const since = new Date(Date.now() - windowDays * 86400000);
  const warnings: string[] = [];

  const [
    leads,
    brokers,
    listings,
    qualifiedCount,
    meetingNegotiationCount,
    wonUpdated,
    revenueForecast,
    weeklyReview,
    fastDeal,
    executionSummary,
    lockSignals,
    capitalPlan,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.user.count({ where: { role: PlatformRole.BROKER } }),
    prisma.fsboListing.count().catch(() => 0),
    prisma.lead.count({
      where: {
        pipelineStage: { in: ["qualified", "meeting", "negotiation", "won"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.lead.count({
      where: {
        pipelineStage: { in: ["meeting", "negotiation"] },
        updatedAt: { gte: since },
      },
    }),
    prisma.lead.count({
      where: { pipelineStage: "won", updatedAt: { gte: since } },
    }),
    engineFlags.revenueForecastV1 ? buildRevenueForecast(windowDays).catch(() => null) : Promise.resolve(null),
    engineFlags.weeklyReviewV1 ? buildWeeklyReviewSummary(windowDays).catch(() => null) : Promise.resolve(null),
    buildFastDealSummary().catch(() => null),
    engineFlags.growthExecutionResultsV1
      ? buildGrowthExecutionResultsSummary(windowDays).catch(() => null)
      : Promise.resolve(null),
    buildBrokerLockInSignals().catch(() => []),
    engineFlags.capitalAllocationV1 ? buildCapitalAllocationPlan(windowDays).catch(() => null) : Promise.resolve(null),
  ]);

  let conversionRate: number | undefined;
  const leadsTouchedWindow = await prisma.lead.count({ where: { updatedAt: { gte: since } } }).catch(() => 0);
  const newLeadsWindow = await prisma.lead.count({ where: { createdAt: { gte: since } } }).catch(() => 0);
  if (newLeadsWindow > 0 && qualifiedCount >= 0) {
    conversionRate = Math.round((qualifiedCount / Math.max(newLeadsWindow, 1)) * 1000) / 10;
  } else {
    warnings.push("conversion_proxy_skipped — insufficient new-lead volume in window for a stable ratio.");
  }

  let closeRate: number | undefined;
  const denomMeetings = meetingNegotiationCount + wonUpdated;
  if (denomMeetings > 0 && wonUpdated >= 0) {
    closeRate = Math.round((wonUpdated / denomMeetings) * 1000) / 10;
  } else if (wonUpdated === 0 && denomMeetings === 0) {
    warnings.push("close_rate_skipped — no negotiation/won activity in-window.");
  }

  let unlockRate: number | undefined;
  if (fastDeal) {
    const sessions = fastDeal.sourcingUsage.reduce((a, r) => a + r.sessionsStarted, 0);
    const leadCap =
      fastDeal.outcomes.find((o) => o.outcomeType === "lead_captured")?.count ?? 0;
    if (sessions > 0) {
      unlockRate = Math.round((leadCap / sessions) * 1000) / 10;
    }
    if (fastDeal.sparse.level !== "ok") {
      warnings.push(`fast_deal_sparse=${fastDeal.sparse.level}`);
    }
  }
  if (unlockRate === undefined) {
    warnings.push("unlock_rate_unavailable — Fast Deal sourcing sessions or outcomes too thin.");
  }

  let revenueEstimate: number | undefined;
  if (revenueForecast?.revenue.expectedRevenue != null && revenueForecast.revenue.expectedRevenue > 0) {
    revenueEstimate = revenueForecast.revenue.expectedRevenue;
    if (revenueForecast.meta.insufficientData) {
      warnings.push("revenue_estimate_illustrative — forecast flagged insufficient backing data.");
    }
  } else {
    warnings.push("revenue_estimate_unavailable — illustrative forecast did not produce a central value.");
  }

  if (executionSummary?.sparseDataWarnings?.length) {
    warnings.push(...executionSummary.sparseDataWarnings.slice(0, 2).map((w) => `deal_performance: ${w}`));
  }

  if (!weeklyReview) {
    warnings.push("weekly_review_unavailable — weekly review layer returned no summary.");
  }

  if (!capitalPlan) {
    warnings.push("capital_allocation_unavailable — plan not built (flag off or sparse inputs).");
  }

  if (lockSignals.length === 0) {
    warnings.push("broker_lock_in_sparse — no dependency rows in-window.");
  }

  let confidence: SimulationBaseline["confidence"] = "high";
  if (warnings.length >= 4) confidence = "low";
  else if (warnings.length >= 2) confidence = "medium";

  if (revenueForecast?.meta.confidence) {
    confidence = minConfidence(confidence, revenueForecast.meta.confidence as SimulationBaseline["confidence"]);
  }

  if (leads < 5 || newLeadsWindow < 2) {
    confidence = minConfidence(confidence, "low");
    warnings.push("low_volume_environment — treat all directional effects as uncertain.");
  }

  return {
    leads,
    brokers,
    listings,
    conversionRate,
    unlockRate,
    closeRate,
    revenueEstimate,
    confidence,
    warnings,
  };
}
