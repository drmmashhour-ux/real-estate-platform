import { describe, expect, it } from "vitest";
import type { FastDealCityComparison, FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";
import { selectTopPerformingCity, TOP_CITY_MIN_SAMPLE_SIZE } from "@/modules/growth/city-playbook-selector.service";
import { extractCityPlaybookTemplate } from "@/modules/growth/city-playbook-patterns.service";
import { compareCityToTemplate } from "@/modules/growth/city-playbook-gap.service";
import { applyAdaptationRules } from "@/modules/growth/city-playbook-adaptation-rules.service";
import { buildCityPlaybookAdaptationBundleCore } from "@/modules/growth/city-playbook-adaptation.service";

function rank(p: Partial<FastDealCityRankEntry> & { city: string }): FastDealCityRankEntry {
  return {
    city: p.city,
    windowDays: p.windowDays ?? 30,
    activity: p.activity ?? {},
    execution: p.execution ?? {},
    progression: p.progression ?? {},
    derived: p.derived ?? {},
    meta: p.meta ?? { sampleSize: 30, dataCompleteness: "high", warnings: [] },
    performanceScore: p.performanceScore ?? 70,
    confidence: p.confidence ?? "medium",
    scoringWarnings: p.scoringWarnings ?? [],
  };
}

describe("selectTopPerformingCity", () => {
  it("returns null when top city is only low confidence", () => {
    const comparison: FastDealCityComparison = {
      rankedCities: [rank({ city: "A", confidence: "low", meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] }, performanceScore: 99 })],
      cities: [],
      insights: [],
      generatedAt: "",
    };
    expect(selectTopPerformingCity(comparison).top).toBeNull();
  });

  it("returns null when best score has insufficient sample", () => {
    const comparison: FastDealCityComparison = {
      rankedCities: [
        rank({
          city: "A",
          confidence: "medium",
          meta: { sampleSize: TOP_CITY_MIN_SAMPLE_SIZE - 1, dataCompleteness: "high", warnings: [] },
          performanceScore: 100,
        }),
      ],
      cities: [],
      insights: [],
      generatedAt: "",
    };
    expect(selectTopPerformingCity(comparison).top).toBeNull();
  });

  it("picks highest score among eligible cities", () => {
    const comparison: FastDealCityComparison = {
      rankedCities: [
        rank({
          city: "Weak",
          confidence: "medium",
          meta: { sampleSize: 30, dataCompleteness: "high", warnings: [] },
          performanceScore: 60,
        }),
        rank({
          city: "Strong",
          confidence: "high",
          meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] },
          performanceScore: 90,
        }),
      ],
      cities: [],
      insights: [],
      generatedAt: "",
    };
    expect(selectTopPerformingCity(comparison).top?.city).toBe("Strong");
  });
});

describe("extractCityPlaybookTemplate", () => {
  it("includes key patterns only when metrics clear internal floors", () => {
    const t = extractCityPlaybookTemplate(
      rank({
        city: "Top",
        derived: {
          captureRate: 0.25,
          playbookCompletionRate: 0.5,
          progressionRate: 0.1,
        },
        execution: { avgCompletionTimeHours: 24 },
        confidence: "high",
        meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] },
        performanceScore: 95,
      }),
    );
    expect(t.keyPatterns.length).toBeGreaterThan(0);
    expect(t.baselineRates.captureRate).toBeCloseTo(0.25);
  });
});

describe("compareCityToTemplate", () => {
  it("flags lower capture vs reference", () => {
    const template = extractCityPlaybookTemplate(
      rank({
        city: "Ref",
        derived: { captureRate: 0.3, playbookCompletionRate: 0.6, progressionRate: 0.15 },
        meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] },
        performanceScore: 90,
      }),
    );
    const target = rank({
      city: "Other",
      derived: { captureRate: 0.05, playbookCompletionRate: 0.6, progressionRate: 0.15 },
      meta: { sampleSize: 20, dataCompleteness: "medium", warnings: [] },
      performanceScore: 40,
    });
    const { gaps } = compareCityToTemplate(target, template);
    expect(gaps.some((g) => g.kind === "capture")).toBe(true);
  });
});

describe("applyAdaptationRules", () => {
  it("maps capture gaps to sourcing suggestions deterministically", () => {
    const out = applyAdaptationRules([
      {
        kind: "capture",
        label: "x",
        severity: "high",
      },
    ]);
    expect(out.suggestions.some((s) => s.includes("sourcing"))).toBe(true);
    expect(out.constraints.some((c) => c.includes("Internal operator"))).toBe(true);
  });
});

describe("buildCityPlaybookAdaptationBundleCore", () => {
  it("produces deterministic ordering of adaptations for fixed comparison input", () => {
    const comparison: FastDealCityComparison = {
      rankedCities: [
        rank({
          city: "LagCity",
          derived: { captureRate: 0.1, playbookCompletionRate: 0.4, progressionRate: 0.05 },
          meta: { sampleSize: 30, dataCompleteness: "medium", warnings: [] },
          performanceScore: 40,
          confidence: "medium",
        }),
        rank({
          city: "RefCity",
          derived: { captureRate: 0.35, playbookCompletionRate: 0.7, progressionRate: 0.2 },
          meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] },
          performanceScore: 92,
          confidence: "high",
        }),
      ],
      cities: [],
      insights: [],
      generatedAt: "2020-01-01T00:00:00.000Z",
    };
    const a = buildCityPlaybookAdaptationBundleCore(comparison);
    const b = buildCityPlaybookAdaptationBundleCore(comparison);
    expect(a.topCity?.city).toBe(b.topCity?.city);
    expect(a.adaptations.map((x) => x.targetCity)).toEqual(b.adaptations.map((x) => x.targetCity));
    expect(a.adaptations.map((x) => x.recommendedAdjustments)).toEqual(b.adaptations.map((x) => x.recommendedAdjustments));
    expect(a.topCity?.city).toBe("RefCity");
    expect(a.adaptations.map((x) => x.targetCity)).toEqual(["LagCity"]);
    expect(a.adaptations[0]?.recommendedAdjustments.length).toBeGreaterThan(0);
  });

  it("skips targets below minimum sample", () => {
    const comparison: FastDealCityComparison = {
      rankedCities: [
        rank({
          city: "RefCity",
          derived: { captureRate: 0.4, playbookCompletionRate: 0.7, progressionRate: 0.2 },
          meta: { sampleSize: 40, dataCompleteness: "high", warnings: [] },
          performanceScore: 90,
          confidence: "high",
        }),
        rank({
          city: "Tiny",
          derived: {},
          meta: { sampleSize: 5, dataCompleteness: "low", warnings: [] },
          performanceScore: 10,
          confidence: "low",
        }),
      ],
      cities: [],
      insights: [],
      generatedAt: "",
    };
    const bundle = buildCityPlaybookAdaptationBundleCore(comparison);
    expect(bundle.adaptations).toHaveLength(0);
    expect(bundle.skippedTargets.some((s) => s.city === "Tiny")).toBe(true);
  });
});
