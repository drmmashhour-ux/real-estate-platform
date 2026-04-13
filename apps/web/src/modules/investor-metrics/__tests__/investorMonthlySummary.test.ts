import type { MetricSnapshot } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { formatMonthlyInvestorSummaryText, type MonthlyInvestorRollup } from "../investorMonthlySummary";

function snap(p: Partial<MetricSnapshot> & Pick<MetricSnapshot, "date">): MetricSnapshot {
  return {
    id: p.id ?? "id",
    date: p.date,
    totalUsers: p.totalUsers ?? 0,
    activeUsers: p.activeUsers ?? 0,
    totalListings: p.totalListings ?? 0,
    bookings: p.bookings ?? 0,
    revenue: p.revenue ?? 0,
    conversionRate: p.conversionRate ?? 0,
    createdAt: p.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("formatMonthlyInvestorSummaryText", () => {
  it("handles empty month", () => {
    const r: MonthlyInvestorRollup = {
      monthLabel: "2026-02",
      year: 2026,
      month: 2,
      lastSnapshotInMonth: null,
      lastSnapshotInPriorMonth: null,
    };
    const t = formatMonthlyInvestorSummaryText(r);
    expect(t).toContain("No MetricSnapshot");
  });

  it("includes MoM when both months present", () => {
    const r: MonthlyInvestorRollup = {
      monthLabel: "2026-03",
      year: 2026,
      month: 3,
      lastSnapshotInMonth: snap({ date: new Date("2026-03-28"), totalUsers: 200, revenue: 500 }),
      lastSnapshotInPriorMonth: snap({ date: new Date("2026-02-27"), totalUsers: 100, revenue: 200 }),
    };
    const t = formatMonthlyInvestorSummaryText(r);
    expect(t).toContain("Total users: 200");
    expect(t).toContain("Change vs prior month");
    expect(t).toContain("+100");
    expect(t).toContain("+300.00");
  });
});
