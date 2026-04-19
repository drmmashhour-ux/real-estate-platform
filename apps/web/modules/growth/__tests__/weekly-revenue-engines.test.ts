import { describe, expect, it } from "vitest";
import { analyzeWeeklyTeamSignals } from "@/modules/growth/weekly-team-review-analysis.service";
import { computeRevenueRisk } from "@/modules/growth/revenue-risk.service";
import { computeRevenueTrendMetrics } from "@/modules/growth/revenue-trend.service";

describe("analyzeWeeklyTeamSignals", () => {
  it("flags insufficient bundle when lowData", () => {
    const r = analyzeWeeklyTeamSignals({
      lowData: true,
      executionCompletionRate: 0,
      tasksBlocked: 0,
      tasksInProgress: 1,
      leadDelta: 0,
      qualifiedRate: 0,
      wonThisWindow: 0,
      cityBundlePresent: false,
    });
    expect(r.insufficient.length).toBeGreaterThan(0);
    expect(r.positive.length).toBe(0);
  });

  it("marks positive momentum when execution and leads improve", () => {
    const r = analyzeWeeklyTeamSignals({
      lowData: false,
      executionCompletionRate: 0.52,
      tasksBlocked: 1,
      tasksInProgress: 4,
      leadDelta: 4,
      qualifiedRate: 0.4,
      wonThisWindow: 1,
      cityBundlePresent: true,
      scalePositive: true,
    });
    expect(r.positive.length).toBeGreaterThan(0);
    expect(r.negative.some((x) => x.includes("Blocked"))).toBe(false);
  });
});

describe("computeRevenueTrendMetrics", () => {
  it("detects upward momentum when composite grows", () => {
    const t = computeRevenueTrendMetrics({
      currentLeads: 22,
      priorLeads: 18,
      currentQualified: 10,
      priorQualified: 8,
    });
    expect(t.momentum).toBe("up");
    expect(t.growthRate != null && t.growthRate > 0).toBe(true);
  });

  it("detects flat band near zero delta", () => {
    const t = computeRevenueTrendMetrics({
      currentLeads: 20,
      priorLeads: 20,
      currentQualified: 8,
      priorQualified: 8,
    });
    expect(t.momentum).toBe("flat");
  });
});

describe("computeRevenueRisk", () => {
  it("elevates data risk when pipeline sparse", () => {
    const r = computeRevenueRisk({
      leadsCount: 6,
      dropOffRatio: 0.5,
      executionCompletionRate: 0.55,
      sparsePipeline: true,
      inconsistentSignals: false,
    });
    expect(r.dataRisk).toBe("high");
  });

  it("drops execution risk when accountability strong", () => {
    const r = computeRevenueRisk({
      leadsCount: 40,
      dropOffRatio: 0.3,
      executionCompletionRate: 0.86,
      sparsePipeline: false,
      inconsistentSignals: false,
    });
    expect(r.executionRisk).toBe("low");
  });
});
