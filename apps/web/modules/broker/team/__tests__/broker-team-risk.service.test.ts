import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";
import {
  assignBrokerTeamRiskLevel,
  inactiveDaysFromLastTouchMs,
} from "@/modules/broker/team/broker-team-risk.service";

function baseMetrics(overrides: Partial<BrokerPerformanceMetrics>): BrokerPerformanceMetrics {
  return {
    brokerId: "b1",
    leadsAssigned: 10,
    leadsContacted: 6,
    leadsResponded: 4,
    meetingsMarked: 2,
    wonDeals: 1,
    lostDeals: 0,
    followUpsDue: 1,
    followUpsCompleted: 2,
    avgResponseDelayHours: 12,
    activityScore: 60,
    conversionScore: 58,
    disciplineScore: 62,
    overallScore: 60,
    confidenceLevel: "medium",
    executionBand: "healthy",
    ...overrides,
  };
}

describe("broker-team-risk.service", () => {
  const nowMs = Date.parse("2026-04-02T12:00:00.000Z");

  it("assigns high risk for heavy overdue backlog", () => {
    const { riskLevel, reasons } = assignBrokerTeamRiskLevel(
      baseMetrics({ followUpsDue: 9 }),
      {
        followUpsOverdue: 8,
        stalledAfterContact: 8,
        inactiveDaysApprox: 3,
      },
      nowMs,
    );
    expect(riskLevel).toBe("high");
    expect(reasons).toContain("High follow-up backlog");
  });

  it("assigns medium risk for moderate overdue + inactive streak", () => {
    const { riskLevel, reasons } = assignBrokerTeamRiskLevel(
      baseMetrics({ leadsAssigned: 12 }),
      {
        followUpsOverdue: 3,
        stalledAfterContact: 6,
        inactiveDaysApprox: 8,
      },
      nowMs,
    );
    expect(riskLevel).toBe("medium");
    expect(reasons).toContain("No recent activity");
  });

  it("assigns low risk for clean cohort", () => {
    const { riskLevel } = assignBrokerTeamRiskLevel(
      baseMetrics({}),
      {
        followUpsOverdue: 0,
        stalledAfterContact: 0,
        inactiveDaysApprox: 2,
      },
      nowMs,
    );
    expect(riskLevel).toBe("low");
  });

  it("inactiveDaysFromLastTouchMs is deterministic", () => {
    const t = Date.parse("2026-03-26T12:00:00.000Z");
    expect(inactiveDaysFromLastTouchMs(t, nowMs)).toBe(7);
    expect(inactiveDaysFromLastTouchMs(0, nowMs)).toBe(999);
  });
});
