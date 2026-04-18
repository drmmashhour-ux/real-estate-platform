import { describe, expect, it } from "vitest";
import {
  buildOperatorActionRecommendations,
  buildOperatorChecklist,
  computeSparseDisplayState,
} from "../revenue-dashboard-operator-guidance";
import type { RevenueDashboardSummary } from "../revenue-dashboard.types";

function minimal(over: Partial<RevenueDashboardSummary> = {}): RevenueDashboardSummary {
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
    activeBrokers: 8,
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
    pctToDailyTarget: null,
    sparseDisplay: { tier: "ok", messages: [] },
    operatorRecommendations: [],
    operatorChecklist: { todayFocus: "", topActions: [] },
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("computeSparseDisplayState", () => {
  it("marks empty when no revenue events and no money", () => {
    const s = computeSparseDisplayState(minimal());
    expect(s.tier).toBe("empty");
    expect(s.messages.some((m) => m.includes("No revenue events"))).toBe(true);
  });

  it("mentions booking revenue when starts exist but no booking_fee", () => {
    const s = computeSparseDisplayState(
      minimal({
        bookingStarts: 4,
        bnhub: { weekBookingFeeRevenue: 0, bookingFeeEventsWeek: 0, avgBookingFee: null },
      }),
    );
    expect(s.messages.some((m) => m.includes("Booking revenue will appear"))).toBe(true);
  });
});

describe("buildOperatorActionRecommendations", () => {
  it("recommends broker unlock push when lead share is low vs week revenue", () => {
    const rec = buildOperatorActionRecommendations(
      minimal({
        revenueWeek: 100,
        revenueBySource: {
          lead_unlock: 10,
          booking_fee: 90,
          boost: 0,
          subscription: 0,
          other: 0,
        },
      }),
    );
    expect(rec.some((x) => x.includes("Lead revenue is low"))).toBe(true);
  });

  it("is deterministic", () => {
    const m = minimal({
      revenueWeek: 100,
      bookingStarts: 5,
      revenueBySource: {
        lead_unlock: 30,
        booking_fee: 0,
        boost: 0,
        subscription: 0,
        other: 70,
      },
    });
    expect(buildOperatorActionRecommendations(m)).toEqual(buildOperatorActionRecommendations(m));
  });
});

describe("buildOperatorChecklist", () => {
  it("surfaces prioritized alert title first", () => {
    const summary = minimal();
    const checklist = buildOperatorChecklist(
      summary,
      [{ id: "x", level: "warning", title: "Fix unlocks", description: "d", priorityScore: 99 }],
      [],
    );
    expect(checklist.todayFocus).toContain("Fix unlocks");
    expect(checklist.topActions[0]).toContain("Fix unlocks");
  });
});
