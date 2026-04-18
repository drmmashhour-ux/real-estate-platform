import { describe, expect, it } from "vitest";
import { evaluateAutomationTriggers } from "../revenue-automation-triggers.service";
import type { MoneyOperatingSystemSnapshot } from "../money-os.types";

function mos(over: Partial<MoneyOperatingSystemSnapshot> = {}): MoneyOperatingSystemSnapshot {
  const base: MoneyOperatingSystemSnapshot = {
    generatedAt: new Date().toISOString(),
    summaryCreatedAt: new Date().toISOString(),
    weekPositiveRevenueEvents: 0,
    mrrCad: null,
    mrrSubscriptionCount: 0,
    mrrMissingData: false,
    targets: { dailyTargetCad: 750, weeklyTargetCad: 5250, monthlyTargetCad: 22500 },
    progress: {
      dailyPct: 0,
      weeklyPct: 0,
      monthlyPct: 0,
      gapDailyCad: 750,
      gapWeeklyCad: 5000,
      gapMonthlyCad: 20000,
      gapMessageToday: "Need more",
    },
    revenueToday: 0,
    revenueWeek: 50,
    revenueMonth: 200,
    sources: [],
    topLeaks: [],
    rankedProblems: [],
    actions: [],
    criticalAlerts: [],
    keyInsights: [],
    autoSuggestions: [],
    checklistHints: { brokersToContactHint: "", listingsSupplyHint: "" },
    meta: {
      leadsViewedWeek: 30,
      leadsUnlockedWeek: 1,
      bookingStartsWeek: 10,
      bookingCompletedWeek: 2,
      bookingCompletionRate: 0.2,
      priorBookingCompletedWeek: 8,
      priorWeekTotalCad: 400,
    },
    ...over,
  };
  return base;
}

describe("evaluateAutomationTriggers", () => {
  it("fires high_traffic_low_revenue when traffic high and revenue weak", () => {
    const t = evaluateAutomationTriggers(
      mos({
        revenueWeek: 80,
        meta: {
          leadsViewedWeek: 25,
          leadsUnlockedWeek: 0,
          bookingStartsWeek: 8,
          bookingCompletedWeek: 0,
          bookingCompletionRate: 0,
          priorBookingCompletedWeek: 0,
          priorWeekTotalCad: 300,
        },
      }),
    );
    expect(t.find((x) => x.id === "high_traffic_low_revenue")?.fired).toBe(true);
  });

  it("fires revenue_drop when week revenue collapses vs prior", () => {
    const t = evaluateAutomationTriggers(
      mos({
        revenueWeek: 40,
        meta: {
          leadsViewedWeek: 5,
          leadsUnlockedWeek: 0,
          bookingStartsWeek: 1,
          bookingCompletedWeek: 0,
          bookingCompletionRate: 0,
          priorBookingCompletedWeek: 2,
          priorWeekTotalCad: 200,
        },
      }),
    );
    expect(t.find((x) => x.id === "revenue_drop")?.fired).toBe(true);
  });
});
