import { describe, expect, it } from "vitest";
import { interpretGrowthRevenueJson } from "../revenue-dashboard-response";
import type { RevenueDashboardSummary } from "../revenue-dashboard.types";

function minimalSummary(): RevenueDashboardSummary {
  const z = {
    lead_unlock: 0,
    booking_fee: 0,
    boost: 0,
    subscription: 0,
    other: 0,
  };
  const detail = {
    lead_unlock: { amount: 0, eventCount: 0, avgAmount: null },
    booking_fee: { amount: 0, eventCount: 0, avgAmount: null },
    boost: { amount: 0, eventCount: 0, avgAmount: null },
    subscription: { amount: 0, eventCount: 0, avgAmount: null },
    other: { amount: 0, eventCount: 0, avgAmount: null },
  };
  return {
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    revenueBySource: z,
    weekPositiveRevenueEvents: 0,
    revenueBySourceDetail: detail,
    bnhub: { weekBookingFeeRevenue: 0, bookingFeeEventsWeek: 0, avgBookingFee: null },
    leadsViewed: 0,
    leadsUnlocked: 0,
    leadUnlockRate: 0,
    activeBrokers: 0,
    payingBrokers: 0,
    brokersGeneratingRevenue: 0,
    unlockedLeadsWeek: 0,
    revenuePerBroker: 0,
    avgRevenuePerActiveBroker7d: 0,
    bookingStarts: 0,
    bookingCompleted: 0,
    bookingCompletionRate: 0,
    alerts: [],
    notes: [],
    dailyTargetCad: 750,
    pctToDailyTarget: 0,
    sparseDisplay: { tier: "ok", messages: [] },
    operatorRecommendations: [],
    operatorChecklist: { todayFocus: "", topActions: [] },
    createdAt: new Date().toISOString(),
  };
}

describe("interpretGrowthRevenueJson", () => {
  it("parses 403 flags-off payload", () => {
    const r = interpretGrowthRevenueJson(403, {
      error: "Revenue dashboard disabled",
      code: "REVENUE_FLAGS_DISABLED",
      requiredFlags: [{ env: "FEATURE_REVENUE_DASHBOARD_V1", hint: "Primary path" }],
    });
    expect(r.kind).toBe("flags_disabled");
    if (r.kind === "flags_disabled") {
      expect(r.payload.requiredFlags).toHaveLength(1);
      expect(r.payload.requiredFlags[0]?.env).toContain("FEATURE_REVENUE");
    }
  });

  it("parses 200 success", () => {
    const s = minimalSummary();
    const r = interpretGrowthRevenueJson(200, { summary: s });
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.summary.revenueToday).toBe(0);
  });

  it("returns error on 200 without summary", () => {
    const r = interpretGrowthRevenueJson(200, {});
    expect(r.kind).toBe("error");
  });
});
