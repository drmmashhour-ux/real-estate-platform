import { describe, expect, it, beforeEach } from "vitest";
import { detectRevenueAlerts } from "../revenue-alerts.service";
import { resetRevenueDashboardAlertIdsForTests } from "../revenue-dashboard-alerts.service";
import type { RevenueDashboardSummary } from "../revenue-dashboard.types";

function baseSummary(over: Partial<RevenueDashboardSummary>): RevenueDashboardSummary {
  return {
    revenueToday: 1,
    revenueWeek: 10,
    revenueMonth: 20,
    revenueBySource: {
      lead_unlock: 8,
      booking_fee: 2,
      boost: 0,
      subscription: 0,
      other: 0,
    },
    leadsViewed: 10,
    leadsUnlocked: 2,
    leadUnlockRate: 0.2,
    activeBrokers: 5,
    payingBrokers: 2,
    revenuePerBroker: 5,
    bookingStarts: 3,
    bookingCompleted: 2,
    bookingCompletionRate: 2 / 3,
    alerts: [],
    notes: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("detectRevenueAlerts", () => {
  beforeEach(() => {
    resetRevenueDashboardAlertIdsForTests();
  });

  it("warns on zero revenue today", () => {
    const a = detectRevenueAlerts(baseSummary({ revenueToday: 0 }));
    expect(a.some((x) => x.title.includes("No revenue today"))).toBe(true);
  });

  it("warns when views exist but no unlocks", () => {
    const a = detectRevenueAlerts(
      baseSummary({ leadsViewed: 5, leadsUnlocked: 0, leadUnlockRate: 0 }),
    );
    expect(a.some((x) => x.title.includes("not converting"))).toBe(true);
  });

  it("does not mutate summary object fields", () => {
    const s = baseSummary({});
    const frozen = Object.freeze({ ...s, revenueBySource: { ...s.revenueBySource } });
    detectRevenueAlerts(frozen);
    expect(frozen.revenueToday).toBe(1);
  });

  it("warns when unlocks exist but no paying brokers attributed", () => {
    const a = detectRevenueAlerts(
      baseSummary({ leadsUnlocked: 3, payingBrokers: 0, leadUnlockRate: 0.3 }),
    );
    expect(a.some((x) => x.title.toLowerCase().includes("broker"))).toBe(true);
  });

  it("warns when bookings start but never complete", () => {
    const a = detectRevenueAlerts(
      baseSummary({ bookingStarts: 4, bookingCompleted: 0, bookingCompletionRate: 0 }),
    );
    expect(a.some((x) => x.title.includes("not completing"))).toBe(true);
  });

  it("caps alert list (bounded)", () => {
    const many = detectRevenueAlerts(
      baseSummary({
        revenueToday: 0,
        leadsViewed: 10,
        leadsUnlocked: 0,
        revenueWeek: 1,
        bookingStarts: 5,
        bookingCompleted: 0,
        leadUnlockRate: 0,
      }),
    );
    expect(many.length).toBeLessThanOrEqual(12);
  });
});
