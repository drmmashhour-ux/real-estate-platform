/**
 * Weekly operator review — aggregates Fast Deal execution + optional execution-results snapshot.
 */

import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  DEFAULT_FAST_DEAL_COMPARISON_CITIES,
  buildCityComparison,
} from "@/modules/growth/fast-deal-city-comparison.service";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import {
  classifyWeeklySignals,
  type ExecCounts,
} from "@/modules/growth/weekly-review-analysis.service";
import { buildWeeklyRecommendations } from "@/modules/growth/weekly-review-recommendations.service";
import { monitorWeeklyReviewBuilt } from "@/modules/growth/weekly-review-monitoring.service";
import type { WeeklyReviewConfidence, WeeklyReviewSummary } from "@/modules/growth/weekly-review.types";

function sliceByDate<T extends { createdAt: Date }>(
  rows: T[],
  startInclusive: Date,
  endExclusive: Date,
): T[] {
  return rows.filter((r) => r.createdAt >= startInclusive && r.createdAt < endExclusive);
}

function aggregateExec(events: { sourceType: string; sourceSubType: string }[]): ExecCounts {
  let leadsCaptured = 0;
  let brokersSourced = 0;
  let playbooksCompleted = 0;
  for (const e of events) {
    if (e.sourceType === "landing_capture" && e.sourceSubType === "lead_submitted") leadsCaptured += 1;
    if (
      e.sourceType === "broker_sourcing" &&
      (e.sourceSubType === "session_started" || e.sourceSubType === "broker_found_manual")
    ) {
      brokersSourced += 1;
    }
    if (e.sourceType === "closing_playbook" && e.sourceSubType === "playbook_session_completed") {
      playbooksCompleted += 1;
    }
  }
  return { leadsCaptured, brokersSourced, playbooksCompleted };
}

export async function buildWeeklyReviewSummary(windowDays = 7): Promise<WeeklyReviewSummary | null> {
  if (!engineFlags.weeklyReviewV1) return null;

  const until = new Date();
  const periodEnd = until.toISOString();
  const currentStart = new Date(until.getTime() - windowDays * 86400000);
  const periodStart = currentStart.toISOString();
  const priorStart = new Date(until.getTime() - 2 * windowDays * 86400000);

  const raw = await prisma.fastDealSourceEvent.findMany({
    where: { createdAt: { gte: priorStart } },
    select: { createdAt: true, sourceType: true, sourceSubType: true },
  });

  const curSlice = sliceByDate(raw, currentStart, until);
  const prevSlice = sliceByDate(raw, priorStart, currentStart);

  const current = aggregateExec(curSlice);
  const prior = aggregateExec(prevSlice);
  const totalEventsInWeek = curSlice.length;

  const classified = classifyWeeklySignals({ current, prior, totalEventsInWeek });

  const cities = [...DEFAULT_FAST_DEAL_COMPARISON_CITIES];
  const comparison =
    engineFlags.fastDealCityComparisonV1 && cities.length > 0
      ? await buildCityComparison(cities, windowDays)
      : null;

  let topCity: string | null = null;
  let weakestCity: string | null = null;
  const majorChanges: string[] = [];

  if (comparison?.rankedCities.length) {
    const r = comparison.rankedCities;
    topCity = r[0]?.city ?? null;
    weakestCity = r[r.length - 1]?.city ?? null;
    majorChanges.push(
      `Highest Fast Deal score this window: ${topCity ?? "n/a"} (${r[0]?.performanceScore ?? "—"} pts).`,
    );
    majorChanges.push(
      `Lowest scored market in bundle: ${weakestCity ?? "n/a"} (${r[r.length - 1]?.performanceScore ?? "—"} pts).`,
    );
  } else {
    majorChanges.push("City performance bundle unavailable — enable Fast Deal city comparison or add events.");
  }

  if (engineFlags.growthExecutionResultsV1) {
    const g = await buildGrowthExecutionResultsSummary(windowDays).catch(() => null);
    if (g?.sparseDataWarnings?.length) {
      majorChanges.push(`Execution results layer: ${g.sparseDataWarnings[0]}`);
    }
  }

  majorChanges.push(
    `Week vs prior: leads ${current.leadsCaptured - prior.leadsCaptured >= 0 ? "+" : ""}${current.leadsCaptured - prior.leadsCaptured}, sourcing ${current.brokersSourced - prior.brokersSourced >= 0 ? "+" : ""}${current.brokersSourced - prior.brokersSourced}, playbooks ${current.playbooksCompleted - prior.playbooksCompleted >= 0 ? "+" : ""}${current.playbooksCompleted - prior.playbooksCompleted}.`,
  );

  const rec = buildWeeklyRecommendations({
    current,
    prior,
    topCity,
    weakestCity,
    sparseWeek: totalEventsInWeek < 12 || classified.insufficientSignals.length > 0,
  });

  let confidence: WeeklyReviewConfidence = "low";
  if (totalEventsInWeek >= 45) confidence = "high";
  else if (totalEventsInWeek >= 20) confidence = "medium";

  const warnings: string[] = [...classified.insufficientSignals];
  if (!comparison) warnings.push("City leaderboard omitted — comparison flag or data unavailable.");
  warnings.push(
    "This weekly review does not connect to Stripe, bookings, or pricing engines — Fast Deal logs and optional execution-results snapshot only.",
  );

  monitorWeeklyReviewBuilt({
    windowDays,
    sparse: totalEventsInWeek < 12,
    confidence,
  });

  return {
    periodStart,
    periodEnd,
    execution: {
      leadsCaptured: current.leadsCaptured,
      brokersSourced: current.brokersSourced,
      playbooksCompleted: current.playbooksCompleted,
    },
    performance: {
      topCity,
      weakestCity,
      majorChanges: majorChanges.slice(0, 8),
    },
    outcomes: {
      positiveSignals: classified.positiveSignals,
      negativeSignals: classified.negativeSignals,
      insufficientSignals: classified.insufficientSignals,
    },
    recommendations: rec,
    meta: { confidence, warnings: warnings.slice(0, 6) },
  };
}
