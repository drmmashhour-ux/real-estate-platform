import { describe, it, expect } from "vitest";
import { buildBnhubRevenueDashboardSnapshot } from "@/lib/bnhub/revenue-dashboard";

describe("buildBnhubRevenueDashboardSnapshot", () => {
  it("sums booking and promotion revenue and computes sales conversion", () => {
    const start = new Date("2025-01-01T00:00:00.000Z");
    const end = new Date("2025-01-31T00:00:00.000Z");
    const snap = buildBnhubRevenueDashboardSnapshot({
      rangeDays: 30,
      rangeStart: start,
      rangeEnd: end,
      bookingRevenueCents: 100_00,
      completedBookingPaymentsCount: 2,
      bookingsCreatedCount: 5,
      confirmedOrCompletedBookingsCount: 4,
      promotionRevenueCents: 25_00,
      paidPromotionOrdersCount: 1,
      salesAssistEntriesCount: 10,
      salesAssistConvertedCount: 3,
      referralSignupsInRange: 2,
      referralRewardsCountInRange: 1,
      automationEventsInRange: 40,
    });

    expect(snap.grandTotalRevenueCents).toBe(125_00);
    expect(snap.salesAssistConversionRate).toBeCloseTo(0.3);
    expect(snap.bookingRevenueCents).toBe(100_00);
    expect(snap.promotionRevenueCents).toBe(25_00);
  });

  it("returns null sales conversion when no assist entries", () => {
    const snap = buildBnhubRevenueDashboardSnapshot({
      rangeDays: 7,
      rangeStart: new Date(),
      rangeEnd: new Date(),
      bookingRevenueCents: 0,
      completedBookingPaymentsCount: 0,
      bookingsCreatedCount: 0,
      confirmedOrCompletedBookingsCount: 0,
      promotionRevenueCents: 0,
      paidPromotionOrdersCount: 0,
      salesAssistEntriesCount: 0,
      salesAssistConvertedCount: 0,
      referralSignupsInRange: 0,
      referralRewardsCountInRange: 0,
      automationEventsInRange: 0,
    });
    expect(snap.salesAssistConversionRate).toBeNull();
  });
});
