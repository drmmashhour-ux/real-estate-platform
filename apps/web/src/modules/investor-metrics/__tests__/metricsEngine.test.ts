import { describe, expect, it } from "vitest";
import {
  computeKpisFromInputs,
  formatInvestorReportText,
  utcDayStart,
} from "../metricsEngine";

describe("metricsEngine", () => {
  it("utcDayStart normalizes to UTC midnight", () => {
    const d = new Date("2026-03-15T22:30:00.000Z");
    const u = utcDayStart(d);
    expect(u.toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("simulates KPIs from users, bookings, and revenue", () => {
    const kpis = computeKpisFromInputs({
      totalUsers: 1000,
      activeUsers: 200,
      bookingsWindow: 40,
      revenueWindow: 8000,
      conversionRate: 0.35,
      marketingSpendWindow: 5000,
      newUsersWindow: 100,
    });
    expect(kpis.cac).toBe(50);
    expect(kpis.bookingRate).toBe(0.2);
    expect(kpis.revenuePerUser).toBe(40);
    expect(kpis.activeUsersPct).toBe(20);
    expect(kpis.conversionRate).toBe(0.35);
  });

  it("CAC is null without spend or new users", () => {
    expect(
      computeKpisFromInputs({
        totalUsers: 100,
        activeUsers: 10,
        bookingsWindow: 1,
        revenueWindow: 100,
        conversionRate: 0.1,
        marketingSpendWindow: 0,
        newUsersWindow: 50,
      }).cac
    ).toBeNull();
    expect(
      computeKpisFromInputs({
        totalUsers: 100,
        activeUsers: 10,
        bookingsWindow: 1,
        revenueWindow: 100,
        conversionRate: 0.1,
        marketingSpendWindow: 1000,
        newUsersWindow: 0,
      }).cac
    ).toBeNull();
  });

  it("formatInvestorReportText includes footer", () => {
    const text = formatInvestorReportText({
      snapshotDate: "2026-03-28",
      snapshot: {
        totalUsers: 500,
        activeUsers: 120,
        totalListings: 80,
        bookings: 25,
        revenue: 3200,
        conversionRate: 0.4,
      },
      kpis: {
        cac: 40,
        conversionRate: 0.4,
        bookingRate: 0.2,
        revenuePerUser: 26.67,
        activeUsersPct: 24,
      },
      marketplace: {
        buyerPersonaUsers: 200,
        totalListings: 80,
        buyersToListingsRatio: 2.5,
        supplyDemandIndex: 1.2,
        brokerResponseRate: 0.55,
        brokerResponseSampleSize: 20,
      },
    });
    expect(text).toContain("LECIPM INVESTOR SYSTEM READY");
    expect(text).toContain("3200");
    expect(text).toContain("Broker response");
  });
});
