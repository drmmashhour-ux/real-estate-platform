import { describe, expect, it } from "vitest";
import { computeDerivedRates } from "@/modules/growth/fast-deal-city-derived.service";
import { buildCityMetricsFromRows } from "@/modules/growth/fast-deal-city-metrics.service";
import { normalizeFastDealCityKey } from "@/modules/growth/fast-deal-city-normalize";
import { computeCityPerformanceScore } from "@/modules/growth/fast-deal-city-scoring.service";
import { generateCityComparisonInsights } from "@/modules/growth/fast-deal-city-insights.service";
import { sortCityRankEntriesByScoreDesc } from "@/modules/growth/fast-deal-city-comparison.service";
import type { FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";

function stubRank(city: string, score: number): FastDealCityRankEntry {
  return {
    city,
    windowDays: 30,
    activity: {},
    execution: {},
    progression: {},
    derived: {},
    meta: { sampleSize: 0, dataCompleteness: "low", warnings: [] },
    performanceScore: score,
    confidence: "low",
    scoringWarnings: [],
  };
}

describe("normalizeFastDealCityKey", () => {
  it("matches cities case-insensitively", () => {
    expect(normalizeFastDealCityKey("Montréal")).toBe(normalizeFastDealCityKey("montréal"));
  });
});

describe("computeDerivedRates", () => {
  it("returns undefined when denominator missing", () => {
    const d = computeDerivedRates({
      city: "X",
      windowDays: 30,
      activity: { leadsCaptured: 3 },
      execution: {},
      progression: {},
    });
    expect(d.captureRate).toBeUndefined();
  });

  it("computes capture and playbook rates", () => {
    const d = computeDerivedRates({
      city: "X",
      windowDays: 30,
      activity: { sourcingSessions: 10, leadsCaptured: 5 },
      execution: { playbookStarted: 4, playbookCompleted: 2 },
      progression: { dealsProgressed: 1 },
    });
    expect(d.captureRate).toBeCloseTo(0.5);
    expect(d.playbookCompletionRate).toBeCloseTo(0.5);
    expect(d.progressionRate).toBeCloseTo(0.2);
  });
});

describe("buildCityMetricsFromRows", () => {
  it("attributes sourcing and landing by city", () => {
    const events = [
      {
        sourceType: "broker_sourcing",
        sourceSubType: "session_started",
        metadataJson: { city: "Montréal" },
      },
      {
        sourceType: "landing_capture",
        sourceSubType: "lead_submitted",
        metadataJson: { marketVariant: "Montréal" },
      },
    ];
    const m = buildCityMetricsFromRows("Montréal", 30, events, []);
    expect(m.activity.sourcingSessions).toBe(1);
    expect(m.activity.leadsCaptured).toBe(1);
  });
});

describe("computeCityPerformanceScore", () => {
  it("penalizes low sample via multiplier", () => {
    const base = buildCityMetricsFromRows(
      "Z",
      30,
      [
        {
          sourceType: "broker_sourcing",
          sourceSubType: "session_started",
          metadataJson: { city: "Z" },
        },
      ],
      [],
    );
    const derived = computeDerivedRates({
      city: base.city,
      windowDays: base.windowDays,
      activity: base.activity,
      execution: base.execution,
      progression: base.progression,
    });
    const r = computeCityPerformanceScore({ ...base, derived });
    expect(r.score).toBeLessThan(50);
    expect(r.confidence).toBe("low");
  });
});

describe("sortCityRankEntriesByScoreDesc", () => {
  it("orders by performance score descending (ties preserve stability)", () => {
    const ranked = sortCityRankEntriesByScoreDesc([
      stubRank("A", 10),
      stubRank("B", 99),
      stubRank("C", 50),
    ]);
    expect(ranked.map((r) => r.city)).toEqual(["B", "C", "A"]);
  });
});

describe("generateCityComparisonInsights", () => {
  it("caps at five lines", () => {
    const ranked = [
      {
        city: "A",
        windowDays: 30,
        activity: {},
        execution: {},
        progression: {},
        derived: { playbookCompletionRate: 0.9 },
        meta: { sampleSize: 50, dataCompleteness: "high" as const, warnings: [] },
        performanceScore: 90,
        confidence: "high" as const,
        scoringWarnings: [],
      },
      {
        city: "B",
        windowDays: 30,
        activity: {},
        execution: {},
        progression: {},
        derived: { playbookCompletionRate: 0.2 },
        meta: { sampleSize: 50, dataCompleteness: "high" as const, warnings: [] },
        performanceScore: 20,
        confidence: "high" as const,
        scoringWarnings: [],
      },
    ];
    const lines = generateCityComparisonInsights(ranked as never);
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});
