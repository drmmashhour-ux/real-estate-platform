import { describe, expect, it } from "vitest";

import { buildAdminAiInsights } from "../admin-ai-insights.service";
import { buildAdminAnomalies } from "../admin-anomaly.service";

describe("admin intelligence rules", () => {
  it("surfaces revenue drop anomaly when today << 7d avg", () => {
    const rows = buildAdminAnomalies({
      rev: {
        todayRevenueCents: 10_000,
        sevenDayAverageCents: 80_000,
        highestHubLabel: "—",
        transactions: 1,
        revenueByHub: [],
        series: [],
      },
      summary: {
        revenueTodayCents: 10_000,
        bookingsToday: 1,
        leadsToday: 1,
        newUsersToday: 0,
        riskAlertsApprox: 0,
      },
      failedPayments24h: 0,
      stalePendingPayments24h: 0,
      priorDayBookings: 1,
    });
    expect(rows.some((r) => r.id === "rev-soft-day")).toBe(true);
  });

  it("flags failed payment volume", () => {
    const rows = buildAdminAnomalies({
      rev: {
        todayRevenueCents: 100_000,
        sevenDayAverageCents: 50_000,
        highestHubLabel: "—",
        transactions: 1,
        revenueByHub: [],
        series: [],
      },
      summary: {
        revenueTodayCents: 100_000,
        bookingsToday: 0,
        leadsToday: 0,
        newUsersToday: 0,
        riskAlertsApprox: 0,
      },
      failedPayments24h: 6,
      stalePendingPayments24h: 0,
      priorDayBookings: 0,
    });
    expect(rows.some((r) => r.id === "pay-fail-volume")).toBe(true);
  });

  it("builds positive insight when above 7d average", () => {
    const insights = buildAdminAiInsights({
      rev: {
        todayRevenueCents: 100_000,
        sevenDayAverageCents: 50_000,
        sevenDaySum: 0,
        highestHubLabel: "BNHub",
        transactions: 3,
        revenueByHub: [
          {
            hubKey: "bnhub",
            hubLabel: "BNHub",
            amountCents: 80_000,
            deltaPctVsPriorDay: 12,
          },
        ],
        series: [],
      },
      summary: {
        revenueTodayCents: 100_000,
        bookingsToday: 2,
        leadsToday: 1,
        newUsersToday: 0,
        riskAlertsApprox: 0,
      },
      agg: {
        periodDays: 30,
        periodStart: "",
        periodEnd: "",
        totalPlatformCents: 1,
        dailyAverageCents: 0,
        transactionCount: 1,
        mrrCentsApprox: 0,
        activeWorkspaceSubscriptions: 0,
        activeBrokerSaaSSubscriptions: 0,
        brokerLeadRevenueCents: 0,
        revenueByHub: [],
        averageRevenuePerPayingUserCents: null,
        payingUsersApprox: 0,
      },
    });
    expect(insights.some((i) => i.id === "top-hub")).toBe(true);
    expect(insights.some((i) => i.id === "rev-vs-avg")).toBe(true);
  });
});
