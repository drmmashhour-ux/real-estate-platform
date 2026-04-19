import type { BrokerTeamRow, BrokerTeamSummary } from "@/modules/broker/team/broker-team.types";
import { buildBrokerTeamInsights } from "@/modules/broker/team/broker-team-insights.service";

function row(partial: Partial<BrokerTeamRow>): BrokerTeamRow {
  return {
    brokerId: partial.brokerId ?? "x",
    displayName: partial.displayName ?? "Broker",
    performanceScore: partial.performanceScore ?? 60,
    band: partial.band ?? "healthy",
    leadsAssigned: partial.leadsAssigned ?? 8,
    leadsActive: partial.leadsActive ?? 5,
    followUpsDue: partial.followUpsDue ?? 0,
    followUpsOverdue: partial.followUpsOverdue ?? 0,
    lastActiveAt: partial.lastActiveAt ?? null,
    riskLevel: partial.riskLevel ?? "low",
    topStrength: partial.topStrength ?? "—",
    topWeakness: partial.topWeakness ?? "—",
  };
}

describe("broker-team-insights.service", () => {
  it("flags follow-up culture when multiple brokers show overdue load", () => {
    const summary: BrokerTeamSummary = {
      totalBrokers: 6,
      activeBrokers: 5,
      inactiveBrokers: 1,
      avgPerformanceScore: 62,
      avgConversionRate: 0.08,
      followUpHealth: "moderate",
    };
    const rows: BrokerTeamRow[] = [
      row({ brokerId: "a", leadsAssigned: 8, followUpsDue: 4, followUpsOverdue: 3 }),
      row({ brokerId: "b", leadsAssigned: 8, followUpsDue: 3, followUpsOverdue: 2 }),
      row({ brokerId: "c", leadsAssigned: 2, followUpsDue: 0, followUpsOverdue: 0 }),
    ];
    const insights = buildBrokerTeamInsights({ summary, rows });
    expect(insights.some((i) => i.type === "follow_up_culture")).toBe(true);
  });

  it("returns deterministic output for the same inputs", () => {
    const summary: BrokerTeamSummary = {
      totalBrokers: 4,
      activeBrokers: 4,
      inactiveBrokers: 0,
      avgPerformanceScore: 55,
      avgConversionRate: 0.05,
      followUpHealth: "good",
    };
    const rows: BrokerTeamRow[] = [row({ brokerId: "only" })];
    const a = buildBrokerTeamInsights({ summary, rows });
    const b = buildBrokerTeamInsights({ summary, rows });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
