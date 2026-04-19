import { describe, expect, it } from "vitest";

import { computeBrokerBadges } from "@/modules/broker/incentives/broker-badge.service";
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
    followUpsDue: 1,
    followUpsCompleted: 8,
    avgResponseDelayHours: 8,
    activityScore: 70,
    conversionScore: 70,
    disciplineScore: 75,
    overallScore: 71,
    confidenceLevel: "medium",
    executionBand: "healthy",
    ...partial,
  };
}

describe("broker-badge.service", () => {
  it("never emits badges for impossible states", () => {
    const m = metrics({
      leadsAssigned: 0,
      leadsContacted: 0,
      leadsResponded: 0,
      wonDeals: 0,
      meetingsMarked: 0,
      followUpsCompleted: 0,
      avgResponseDelayHours: undefined,
      disciplineScore: 40,
      confidenceLevel: "insufficient",
    });
    const badges = computeBrokerBadges(m, "2026-04-01T00:00:00.000Z");
    expect(badges.filter((b) => b.id === "closer")).toHaveLength(0);
  });

  it("unlocks closer when wins exist", () => {
    const badges = computeBrokerBadges(metrics({ wonDeals: 2 }), "2026-04-01T00:00:00.000Z");
    expect(badges.some((b) => b.id === "closer")).toBe(true);
  });

  it("is deterministic", () => {
    const m = metrics({});
    const a = computeBrokerBadges(m, "2026-04-01T00:00:00.000Z");
    const b = computeBrokerBadges(m, "2026-04-01T00:00:00.000Z");
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });
});
