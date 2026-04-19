import { describe, expect, it } from "vitest";

import { computeBrokerMilestonesFromMetricsOnly } from "@/modules/broker/incentives/broker-milestone.service";
import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";

function metrics(partial: Partial<BrokerPerformanceMetrics>): BrokerPerformanceMetrics {
  return {
    brokerId: "b1",
    leadsAssigned: 5,
    leadsContacted: 3,
    leadsResponded: 2,
    meetingsMarked: 1,
    wonDeals: 0,
    lostDeals: 0,
    followUpsDue: 0,
    followUpsCompleted: 2,
    activityScore: 50,
    conversionScore: 50,
    disciplineScore: 50,
    overallScore: 50,
    confidenceLevel: "low",
    executionBand: "healthy",
    ...partial,
  };
}

describe("broker-milestone.service", () => {
  it("marks first_contact when contacted count sufficient", () => {
    const ms = computeBrokerMilestonesFromMetricsOnly(metrics({ leadsContacted: 1 }));
    expect(ms.find((m) => m.id === "first_contact")?.achieved).toBe(true);
  });

  it("requires five follow-ups for follow-up milestone", () => {
    const low = computeBrokerMilestonesFromMetricsOnly(metrics({ followUpsCompleted: 3 }));
    const ok = computeBrokerMilestonesFromMetricsOnly(metrics({ followUpsCompleted: 5 }));
    expect(low.find((m) => m.id === "five_followups_logged")?.achieved).toBe(false);
    expect(ok.find((m) => m.id === "five_followups_logged")?.achieved).toBe(true);
  });
});
