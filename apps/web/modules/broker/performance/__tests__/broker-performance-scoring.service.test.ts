import { describe, expect, it } from "vitest";

import {
  classifyExecutionBand,
  deriveActivityScore,
  deriveConfidence,
  deriveConversionScore,
  deriveDisciplineScore,
  deriveOverallScore,
  scoreBrokerPerformanceMetrics,
} from "@/modules/broker/performance/broker-performance-scoring.service";
import type { BrokerPerformanceMetricsInput } from "@/modules/broker/performance/broker-performance-scoring.service";

function baseInput(overrides: Partial<BrokerPerformanceMetricsInput>): BrokerPerformanceMetricsInput {
  return {
    brokerId: "b1",
    leadsAssigned: 20,
    leadsContacted: 15,
    leadsResponded: 10,
    meetingsMarked: 6,
    wonDeals: 2,
    lostDeals: 1,
    followUpsDue: 2,
    followUpsCompleted: 8,
    avgResponseDelayHours: 8,
    ...overrides,
  };
}

describe("broker-performance-scoring.service", () => {
  it("deriveConfidence marks sparse samples", () => {
    expect(deriveConfidence(3)).toBe("insufficient");
    expect(deriveConfidence(8)).toBe("low");
    expect(deriveConfidence(20)).toBe("medium");
    expect(deriveConfidence(30)).toBe("high");
  });

  it("insufficient sample forces insufficient_data band", () => {
    const input = baseInput({ leadsAssigned: 3, leadsContacted: 2 });
    const m = scoreBrokerPerformanceMetrics(input);
    expect(m.executionBand).toBe("insufficient_data");
    expect(m.confidenceLevel).toBe("insufficient");
  });

  it("does not divide by zero on empty cohorts", () => {
    const input: BrokerPerformanceMetricsInput = {
      brokerId: "b0",
      leadsAssigned: 0,
      leadsContacted: 0,
      leadsResponded: 0,
      meetingsMarked: 0,
      wonDeals: 0,
      lostDeals: 0,
      followUpsDue: 0,
      followUpsCompleted: 0,
    };
    const m = scoreBrokerPerformanceMetrics(input);
    expect(m.activityScore).toBeGreaterThanOrEqual(0);
    expect(m.activityScore).toBeLessThanOrEqual(100);
    expect(m.conversionScore).toBeGreaterThanOrEqual(0);
    expect(m.conversionScore).toBeLessThanOrEqual(100);
    expect(m.disciplineScore).toBeGreaterThanOrEqual(0);
    expect(m.disciplineScore).toBeLessThanOrEqual(100);
  });

  it("scoreBrokerPerformanceMetrics is deterministic", () => {
    const input = baseInput({});
    expect(scoreBrokerPerformanceMetrics(input)).toEqual(scoreBrokerPerformanceMetrics(input));
  });

  it("sub-scores stay in 0–100", () => {
    const input = baseInput({});
    expect(deriveActivityScore(input)).toBeGreaterThanOrEqual(0);
    expect(deriveConversionScore(input)).toBeGreaterThanOrEqual(0);
    expect(deriveDisciplineScore(input)).toBeGreaterThanOrEqual(0);
    const o = deriveOverallScore(
      deriveActivityScore(input),
      deriveConversionScore(input),
      deriveDisciplineScore(input),
    );
    expect(o).toBeGreaterThanOrEqual(0);
    expect(o).toBeLessThanOrEqual(100);
  });

  it("classifyExecutionBand respects insufficient gate", () => {
    expect(classifyExecutionBand(95, "insufficient")).toBe("insufficient_data");
    expect(classifyExecutionBand(90, "high")).toBe("elite");
  });
});
