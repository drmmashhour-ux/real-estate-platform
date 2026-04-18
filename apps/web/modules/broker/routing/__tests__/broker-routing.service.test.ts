import { describe, expect, it } from "vitest";
import { computeRoutingBreakdown } from "@/modules/broker/routing/broker-routing.service";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";
import type { NormalizedRoutingBroker, NormalizedRoutingLead } from "@/modules/broker/routing/broker-routing-normalizer.service";

const lead = (over: Partial<NormalizedRoutingLead> = {}): NormalizedRoutingLead => ({
  intent: "buy",
  regionKey: "montreal",
  regionLabel: "Montreal",
  ...over,
});

const broker = (over: Partial<NormalizedRoutingBroker> = {}): NormalizedRoutingBroker => ({
  brokerId: "b1",
  name: "Test",
  regionKeys: ["montreal"],
  launchPersonaChoice: "find",
  growthOutreachSegment: null,
  ...over,
});

const perf = (overall: number): BrokerPerformanceSummary => ({
  brokerId: "b1",
  overallScore: overall,
  band: "good",
  breakdown: {
    responseSpeedScore: 70,
    contactRateScore: 70,
    engagementScore: 70,
    closeSignalScore: 70,
    retentionScore: 70,
  },
  strongSignals: [],
  weakSignals: [],
  recommendations: [],
  createdAt: new Date().toISOString(),
});

describe("computeRoutingBreakdown", () => {
  it("returns bounded scores with partial performance data", () => {
    const b = computeRoutingBreakdown(lead(), broker(), null, 5);
    expect(b.regionFitScore).toBeGreaterThanOrEqual(0);
    expect(b.regionFitScore).toBeLessThanOrEqual(100);
    Object.values(b).forEach((v) => {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("uses performance summary when provided", () => {
    const b = computeRoutingBreakdown(lead(), broker(), perf(82), 2);
    expect(b.performanceFitScore).toBe(82);
  });

  it("lowers availability when broker load is high", () => {
    const low = computeRoutingBreakdown(lead(), broker(), perf(60), 5);
    const high = computeRoutingBreakdown(lead(), broker(), perf(60), 50);
    expect(low.availabilityFitScore).toBeGreaterThan(high.availabilityFitScore);
  });
});
