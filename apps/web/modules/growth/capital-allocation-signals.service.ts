/**
 * Pulls real aggregates only — missing modules stay undefined / null (never fabricated zeros).
 */

import { engineFlags } from "@/config/feature-flags";
import {
  DEFAULT_FAST_DEAL_COMPARISON_CITIES,
  buildCityComparison,
} from "@/modules/growth/fast-deal-city-comparison.service";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { buildWeeklyReviewSummary } from "@/modules/growth/weekly-review.service";
import { buildMarketExpansionRecommendations } from "@/modules/growth/market-expansion.service";
import { buildScaleSystemResults } from "@/modules/growth/scale-system-results.service";
import { buildBrokerCompetitionResults } from "@/modules/growth/broker-competition-results.service";
import type { FastDealCityComparison } from "@/modules/growth/fast-deal-city-comparison.types";
import type { GrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.types";
import type { MarketExpansionCandidate, MarketExpansionRecommendation } from "@/modules/growth/market-expansion.types";
import type { WeeklyReviewSummary } from "@/modules/growth/weekly-review.types";

export type NormalizedCitySignals = {
  city: string;
  /** Fast Deal city comparison score when available. */
  performanceScore?: number;
  cityConfidence?: "low" | "medium" | "high";
  /** Average of defined derived rates (0–1 each) → 0–1 strength. */
  executionStrength?: number;
  /** From market expansion candidate score / 100. */
  growthPotential?: number;
  /** expansion readiness + confidence hints. */
  expansionReadiness?: "low" | "medium" | "high";
  expansionConfidence?: "low" | "medium" | "high";
  similarityToTop?: number;
  demandSignal?: number;
  supplySignal?: number;
  /** Derived: weak capture vs peers in bundle. */
  weakConversionHint?: boolean;
  /** Derived: demand proxy high, supply listing count low. */
  thinSupplyHint?: boolean;
  dataTier: "low" | "medium" | "high";
};

export type CapitalSignalSnapshot = {
  windowDays: number;
  comparison: FastDealCityComparison | null;
  execution: GrowthExecutionResultsSummary | null;
  weekly: WeeklyReviewSummary | null;
  expansion: MarketExpansionRecommendation | null;
  scale: Awaited<ReturnType<typeof buildScaleSystemResults>>;
  brokers: Awaited<ReturnType<typeof buildBrokerCompetitionResults>>;
  citiesNormalized: NormalizedCitySignals[];
};

function avgRates(r: {
  captureRate?: number;
  playbookCompletionRate?: number;
  progressionRate?: number;
}): number | undefined {
  const xs = [r.captureRate, r.playbookCompletionRate, r.progressionRate].filter(
    (x): x is number => x != null && Number.isFinite(x),
  );
  if (!xs.length) return undefined;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function collectCapitalAllocationSignals(windowDays: number): Promise<CapitalSignalSnapshot> {
  const cities = [...DEFAULT_FAST_DEAL_COMPARISON_CITIES];

  let comparison: FastDealCityComparison | null = null;
  if (engineFlags.fastDealCityComparisonV1) {
    comparison = await buildCityComparison(cities, windowDays);
  }

  let execution: GrowthExecutionResultsSummary | null = null;
  if (engineFlags.growthExecutionResultsV1) {
    execution = await buildGrowthExecutionResultsSummary(windowDays).catch(() => null);
  }

  let weekly: WeeklyReviewSummary | null = null;
  if (engineFlags.weeklyReviewV1) {
    weekly = await buildWeeklyReviewSummary(Math.min(windowDays, 14)).catch(() => null);
  }

  let expansion: MarketExpansionRecommendation | null = null;
  if (engineFlags.marketExpansionV1 && engineFlags.fastDealCityComparisonV1) {
    expansion = await buildMarketExpansionRecommendations(cities, windowDays).catch(() => null);
  }

  const scale = await buildScaleSystemResults(windowDays).catch(() => []);

  let brokers: Awaited<ReturnType<typeof buildBrokerCompetitionResults>> = [];
  if (engineFlags.brokerCompetitionV1) {
    brokers = await buildBrokerCompetitionResults(windowDays).catch(() => []);
  }

  const captures: number[] = [];
  if (comparison) {
    for (const r of comparison.rankedCities) {
      const lc = r.activity.leadsCaptured;
      if (lc != null && lc > 0) captures.push(lc);
    }
  }
  const medCaptures = median(captures);

  const expByCity = new Map<string, MarketExpansionCandidate>();
  if (expansion) {
    for (const c of expansion.topCandidates) {
      expByCity.set(c.city, c);
    }
  }

  const citiesNormalized: NormalizedCitySignals[] = [];

  if (comparison) {
    for (const row of comparison.rankedCities) {
      const ec = expByCity.get(row.city);
      const str = avgRates(row.derived);
      const weakConversion =
        medCaptures != null &&
        row.activity.leadsCaptured != null &&
        row.activity.leadsCaptured >= medCaptures &&
        row.derived.playbookCompletionRate != null &&
        row.derived.playbookCompletionRate < 0.38;

      const thinSupply =
        ec != null &&
        ec.demandSignal != null &&
        ec.demandSignal >= 2 &&
        (ec.supplySignal == null || ec.supplySignal <= 3);

      let dataTier: NormalizedCitySignals["dataTier"] = "low";
      if (row.meta.sampleSize >= 35 && row.meta.dataCompleteness === "high") dataTier = "high";
      else if (row.meta.sampleSize >= 18 && row.meta.dataCompleteness !== "low") dataTier = "medium";

      citiesNormalized.push({
        city: row.city,
        performanceScore: row.performanceScore,
        cityConfidence: row.confidence,
        executionStrength: str,
        growthPotential: ec ? ec.score / 100 : undefined,
        expansionReadiness: ec?.readiness,
        expansionConfidence: ec?.confidence,
        similarityToTop: ec?.similarityToTopCity,
        demandSignal: ec?.demandSignal,
        supplySignal: ec?.supplySignal,
        weakConversionHint: weakConversion === true,
        thinSupplyHint: thinSupply === true,
        dataTier,
      });
    }
  }

  if (expansion) {
    const seen = new Set(citiesNormalized.map((c) => c.city));
    for (const ec of expansion.topCandidates) {
      if (seen.has(ec.city)) continue;
      seen.add(ec.city);
      let tier: NormalizedCitySignals["dataTier"] = "low";
      if (ec.confidence !== "low") tier = "medium";

      citiesNormalized.push({
        city: ec.city,
        growthPotential: ec.score / 100,
        expansionReadiness: ec.readiness,
        expansionConfidence: ec.confidence,
        similarityToTop: ec.similarityToTopCity,
        demandSignal: ec.demandSignal,
        supplySignal: ec.supplySignal,
        thinSupplyHint:
          ec.demandSignal != null &&
          ec.demandSignal >= 2 &&
          (ec.supplySignal == null || ec.supplySignal <= 3),
        weakConversionHint: false,
        dataTier: tier,
      });
    }
  }

  citiesNormalized.sort((a, b) => a.city.localeCompare(b.city));

  return {
    windowDays,
    comparison,
    execution,
    weekly,
    expansion,
    scale,
    brokers,
    citiesNormalized,
  };
}
