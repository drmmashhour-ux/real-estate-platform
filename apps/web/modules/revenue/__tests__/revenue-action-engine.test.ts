import { describe, expect, it } from "vitest";
import { generateMoneyActions } from "../revenue-action-engine.service";
import type { RankedProblem } from "../money-os.types";
import type { RevenueDashboardSummary } from "../revenue-dashboard.types";

function stubSummary(over: Partial<RevenueDashboardSummary>): RevenueDashboardSummary {
  const base: RevenueDashboardSummary = {
    revenueToday: 0,
    revenueWeek: 100,
    revenueMonth: 400,
    revenueBySource: {
      lead_unlock: 40,
      booking_fee: 30,
      boost: 10,
      subscription: 10,
      other: 10,
    },
    weekPositiveRevenueEvents: 12,
    revenueBySourceDetail: {
      lead_unlock: { amount: 40, eventCount: 4, avgAmount: 10 },
      booking_fee: { amount: 30, eventCount: 5, avgAmount: 6 },
      boost: { amount: 10, eventCount: 2, avgAmount: 5 },
      subscription: { amount: 10, eventCount: 2, avgAmount: 5 },
      other: { amount: 10, eventCount: 1, avgAmount: 10 },
    },
    bnhub: { weekBookingFeeRevenue: 30, bookingFeeEventsWeek: 5, avgBookingFee: 6 },
    leadsViewed: 20,
    leadsUnlocked: 3,
    leadUnlockRate: 0.15,
    activeBrokers: 10,
    payingBrokers: 4,
    brokersGeneratingRevenue: 4,
    unlockedLeadsWeek: 3,
    revenuePerBroker: 25,
    avgRevenuePerActiveBroker7d: 10,
    bookingStarts: 10,
    bookingCompleted: 6,
    bookingCompletionRate: 0.6,
    alerts: [],
    notes: [],
    dailyTargetCad: 750,
    pctToDailyTarget: 0.05,
    sparseDisplay: { tier: "ok", messages: [] },
    operatorRecommendations: [],
    operatorChecklist: { todayFocus: "", topActions: [] },
    createdAt: new Date().toISOString(),
    ...over,
  };
  return base;
}

describe("generateMoneyActions", () => {
  it("returns deterministic actions for ranked problems", () => {
    const ranked: RankedProblem[] = [
      {
        id: "p1",
        title: "Lead pipeline not monetizing",
        detail: "",
        impactScore: 90,
        kind: "leak",
      },
    ];
    const a = generateMoneyActions(stubSummary({}), ranked);
    expect(a.length).toBeGreaterThanOrEqual(1);
    expect(a.some((x) => /brokers/i.test(x.text))).toBe(true);
    expect(generateMoneyActions(stubSummary({}), ranked).map((x) => x.id)).toEqual(
      generateMoneyActions(stubSummary({}), ranked).map((x) => x.id),
    );
  });

  it("caps at 5 actions", () => {
    const many: RankedProblem[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `x-${i}`,
      title: "BNHub checkout drop-off",
      detail: "",
      impactScore: 90 - i,
      kind: "leak" as const,
    }));
    expect(generateMoneyActions(stubSummary({}), many).length).toBeLessThanOrEqual(5);
  });
});
