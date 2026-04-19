/**
 * Builds multi-city Fast Deal comparison — deterministic, admin-only.
 */

import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import type { FastDealCityComparison, FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";
import { computeDerivedRates } from "@/modules/growth/fast-deal-city-derived.service";
import { buildCityMetricsFromRows } from "@/modules/growth/fast-deal-city-metrics.service";
import { computeCityPerformanceScore } from "@/modules/growth/fast-deal-city-scoring.service";
import { generateCityComparisonInsights } from "@/modules/growth/fast-deal-city-insights.service";
import { monitorCityComparisonBuilt } from "@/modules/growth/fast-deal-city-monitoring.service";

export const DEFAULT_FAST_DEAL_COMPARISON_CITIES = ["Montréal", "Québec City", "Toronto", "Ottawa"] as const;

/** Deterministic ordering for comparison tables — highest score first. */
export function sortCityRankEntriesByScoreDesc(entries: FastDealCityRankEntry[]): FastDealCityRankEntry[] {
  return [...entries].sort((a, b) => b.performanceScore - a.performanceScore);
}

export async function buildCityComparison(
  cities: string[],
  windowDays: number,
): Promise<FastDealCityComparison | null> {
  if (!engineFlags.fastDealCityComparisonV1 || cities.length === 0) return null;

  const since = new Date(Date.now() - windowDays * 86400000);

  const [events, outcomes] = await Promise.all([
    prisma.fastDealSourceEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { sourceType: true, sourceSubType: true, metadataJson: true },
    }),
    prisma.fastDealOutcome.findMany({
      where: { createdAt: { gte: since } },
      select: { outcomeType: true, metadataJson: true },
    }),
  ]);

  const enriched: FastDealCityRankEntry[] = [];

  for (const city of cities) {
    const base = buildCityMetricsFromRows(city, windowDays, events, outcomes);
    const derived = computeDerivedRates({
      city: base.city,
      windowDays: base.windowDays,
      activity: base.activity,
      execution: base.execution,
      progression: base.progression,
    });
    const withDerived = { ...base, derived };
    const scoring = computeCityPerformanceScore(withDerived);

    enriched.push({
      ...withDerived,
      performanceScore: scoring.score,
      confidence: scoring.confidence,
      scoringWarnings: scoring.warnings,
    });
  }

  const rankedCities = sortCityRankEntriesByScoreDesc(enriched);

  const lowConfidence = enriched.filter((e) => e.confidence === "low").length;
  monitorCityComparisonBuilt({
    cities: enriched.length,
    windowDays,
    lowConfidence,
  });

  const insights = generateCityComparisonInsights(rankedCities);

  return {
    cities: enriched,
    rankedCities,
    insights,
    generatedAt: new Date().toISOString(),
  };
}
