import { describe, expect, it } from "vitest";

import { buildBrokerPerformanceInsights } from "@/modules/broker/performance/broker-performance-insights.service";
import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";

function metrics(partial: Partial<BrokerPerformanceMetrics>): BrokerPerformanceMetrics {
  return {
    brokerId: "b1",
    leadsAssigned: 12,
    leadsContacted: 10,
    leadsResponded: 6,
    meetingsMarked: 4,
    wonDeals: 1,
    lostDeals: 0,
    followUpsDue: 4,
    followUpsCompleted: 5,
    activityScore: 55,
    conversionScore: 60,
    disciplineScore: 50,
    overallScore: 56,
    confidenceLevel: "medium",
    executionBand: "healthy",
    ...partial,
  };
}

describe("broker-performance-insights.service", () => {
  it("flags insufficient data explicitly", () => {
    const ins = buildBrokerPerformanceInsights(
      metrics({ confidenceLevel: "insufficient", executionBand: "insufficient_data", leadsAssigned: 2 }),
    );
    expect(ins.some((i) => i.type === "data_quality")).toBe(true);
  });

  it("detects stuck follow-ups deterministically", () => {
    const ins = buildBrokerPerformanceInsights(metrics({ followUpsDue: 5 }));
    expect(ins.some((i) => i.label.includes("stuck"))).toBe(true);
  });
});
