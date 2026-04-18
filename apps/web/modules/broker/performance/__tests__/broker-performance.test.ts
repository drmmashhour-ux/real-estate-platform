import { describe, expect, it } from "vitest";
import { computePerformanceBreakdownFromMetrics } from "@/modules/broker/performance/broker-performance.service";
import { classifyBrokerPerformanceBand } from "@/modules/broker/performance/broker-performance-status.service";
import { buildBrokerPerformanceRecommendations } from "@/modules/broker/performance/broker-performance-recommendations.service";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";

describe("broker performance V1", () => {
  it("degrades safely with sparse data", () => {
    const { breakdown, weakSignals } = computePerformanceBreakdownFromMetrics({
      totalLeads: 1,
      contactedOrBetter: 0,
      respondedOrBetter: 0,
      meetingOrBetter: 0,
      closedWon: 0,
      closedLost: 0,
      unlockContactPairs: [],
      avgEngagementField: null,
      repliedCount: 0,
      leadUnlockPaidCount: 0,
    });
    expect(breakdown.contactRateScore).toBeGreaterThanOrEqual(0);
    expect(breakdown.contactRateScore).toBeLessThanOrEqual(100);
    expect(weakSignals.length).toBeGreaterThan(0);
  });

  it("classifies bands conservatively", () => {
    expect(classifyBrokerPerformanceBand(80, { weak: [], strong: ["a"] })).toBe("strong");
    expect(classifyBrokerPerformanceBand(80, { weak: ["a", "b"], strong: [] })).toBe("good");
    expect(classifyBrokerPerformanceBand(60, { weak: [], strong: [] })).toBe("good");
    expect(classifyBrokerPerformanceBand(40, { weak: ["x"], strong: [] })).toBe("watch");
    expect(classifyBrokerPerformanceBand(10, { weak: [], strong: [] })).toBe("low");
  });

  it("recommendations are deterministic from summary", () => {
    const summary: BrokerPerformanceSummary = {
      brokerId: "b1",
      overallScore: 40,
      band: "watch",
      breakdown: {
        responseSpeedScore: 30,
        contactRateScore: 30,
        engagementScore: 30,
        closeSignalScore: 30,
        retentionScore: 30,
      },
      strongSignals: [],
      weakSignals: ["Small sample: few timed unlock→contact pairs — response speed is directional only."],
      recommendations: [],
      createdAt: new Date().toISOString(),
    };
    const recs = buildBrokerPerformanceRecommendations({ ...summary, recommendations: [] });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.title.length > 0)).toBe(true);
  });
});
