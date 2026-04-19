import { describe, expect, it } from "vitest";
import { computeCitySimilarity } from "@/modules/growth/market-expansion-similarity.service";
import { scoreExpansionCandidate } from "@/modules/growth/market-expansion-scoring.service";
import { classifyWeeklySignals } from "@/modules/growth/weekly-review-analysis.service";
import type { CityExpansionSignals } from "@/modules/growth/market-expansion-signals.service";
import type { FastDealCityMetrics } from "@/modules/growth/fast-deal-city-comparison.types";

function m(
  city: string,
  meta: FastDealCityMetrics["meta"],
  derived: FastDealCityMetrics["derived"] = {},
): FastDealCityMetrics {
  return {
    city,
    windowDays: 30,
    activity: {},
    execution: {},
    progression: {},
    derived: { ...derived },
    meta,
  };
}

function sig(
  city: string,
  mm: FastDealCityMetrics,
  d: CityExpansionSignals["derived"],
  extra: Partial<Pick<CityExpansionSignals, "demandSignal" | "supplyListingCount" | "competitionSignal" | "demandSupplyRatio">> = {},
): CityExpansionSignals {
  return {
    city,
    normalizedKey: city,
    metrics: mm,
    derived: d,
    ...extra,
  };
}

describe("computeCitySimilarity", () => {
  it("returns higher similarity when ratios align", () => {
    const top = sig(
      "Top",
      m("Top", { sampleSize: 40, dataCompleteness: "high", warnings: [] }, { captureRate: 0.4, playbookCompletionRate: 0.6, progressionRate: 0.2 }),
      { captureRate: 0.4, playbookCompletionRate: 0.6, progressionRate: 0.2 },
      { demandSupplyRatio: 0.1 },
    );
    const close = sig(
      "Close",
      m("Close", { sampleSize: 40, dataCompleteness: "high", warnings: [] }, { captureRate: 0.42, playbookCompletionRate: 0.58, progressionRate: 0.19 }),
      { captureRate: 0.42, playbookCompletionRate: 0.58, progressionRate: 0.19 },
      { demandSupplyRatio: 0.11 },
    );
    const far = sig(
      "Far",
      m("Far", { sampleSize: 40, dataCompleteness: "high", warnings: [] }, { captureRate: 0.05, playbookCompletionRate: 0.2, progressionRate: 0.01 }),
      { captureRate: 0.05, playbookCompletionRate: 0.2, progressionRate: 0.01 },
      { demandSupplyRatio: 0.9 },
    );
    expect(computeCitySimilarity(top, close).similarityScore).toBeGreaterThan(
      computeCitySimilarity(top, far).similarityScore,
    );
  });
});

describe("scoreExpansionCandidate", () => {
  it("scores deterministically for identical inputs", () => {
    const mm = m("A", { sampleSize: 40, dataCompleteness: "high", warnings: [] });
    const s = sig(mm.city, mm, {}, {
      demandSignal: 10,
      supplyListingCount: 50,
      competitionSignal: 5,
    });
    const a = scoreExpansionCandidate({
      signals: s,
      similarityScore: 0.8,
      maxDemandAmongCities: 10,
      maxCompetitionAmongCities: 10,
      topDemandSupply: 0.2,
    });
    const b = scoreExpansionCandidate({
      signals: s,
      similarityScore: 0.8,
      maxDemandAmongCities: 10,
      maxCompetitionAmongCities: 10,
      topDemandSupply: 0.2,
    });
    expect(a.score).toBe(b.score);
  });
});

describe("classifyWeeklySignals", () => {
  it("flags insufficient volume", () => {
    const out = classifyWeeklySignals({
      current: { leadsCaptured: 1, brokersSourced: 1, playbooksCompleted: 0 },
      prior: { leadsCaptured: 0, brokersSourced: 0, playbooksCompleted: 0 },
      totalEventsInWeek: 5,
    });
    expect(out.insufficientSignals.some((x) => x.includes("below"))).toBe(true);
  });

  it("records positive deltas when thresholds met", () => {
    const out = classifyWeeklySignals({
      current: { leadsCaptured: 10, brokersSourced: 10, playbooksCompleted: 4 },
      prior: { leadsCaptured: 5, brokersSourced: 5, playbooksCompleted: 2 },
      totalEventsInWeek: 40,
    });
    expect(out.positiveSignals.length).toBeGreaterThan(0);
  });
});
