import { describe, expect, it } from "vitest";

import {
  buildFamilySubscriptionRevenueSummary,
  buildResidenceRevenueBreakdown,
  buildSoinsRevenueSummary,
} from "../soins-revenue-report.service";
import type { RevenueLedgerEntry } from "../soins-revenue.types";

function entry(p: Partial<RevenueLedgerEntry> & Pick<RevenueLedgerEntry, "id" | "amount" | "occurredAt">): RevenueLedgerEntry {
  return {
    currency: "CAD",
    category: "SERVICE_FEE",
    residenceId: null,
    residentId: null,
    familyUserId: null,
    serviceType: null,
    ...p,
  };
}

describe("buildSoinsRevenueSummary", () => {
  const period = {
    start: new Date("2024-06-01T00:00:00.000Z"),
    end: new Date("2024-06-30T23:59:59.999Z"),
  };

  it("aggregates by residence, category, family addons, and overdue convention", () => {
    const entries: RevenueLedgerEntry[] = [
      entry({
        id: "1",
        category: "RESIDENCE_SUBSCRIPTION",
        amount: 2000,
        residenceId: "res-a",
        occurredAt: new Date("2024-06-10T12:00:00.000Z"),
      }),
      entry({
        id: "2",
        category: "FAMILY_ADDON",
        amount: 29,
        serviceType: "CAMERA_ACCESS",
        residenceId: "res-a",
        occurredAt: new Date("2024-06-11T12:00:00.000Z"),
      }),
      entry({
        id: "3",
        category: "MONITORING",
        amount: 49,
        residenceId: "res-b",
        occurredAt: new Date("2024-06-12T12:00:00.000Z"),
      }),
      entry({
        id: "4",
        category: "SERVICE_FEE",
        amount: 100,
        occurredAt: new Date("2024-06-14T12:00:00.000Z"),
      }),
      entry({
        id: "5",
        category: "LISTING_FEE",
        amount: 150,
        serviceType: "OVERDUE_BALANCE",
        occurredAt: new Date("2024-06-15T12:00:00.000Z"),
      }),
    ];

    const summary = buildSoinsRevenueSummary(entries, period, "CAD");

    expect(summary.revenueByFamilyAddons).toBe(29);
    expect(summary.overdueTotal).toBe(150);
    expect(summary.revenueByResidence.find((r) => r.residenceId === "res-a")?.amount).toBe(2029);
    expect(summary.revenueByResidence.find((r) => r.residenceId === "res-b")?.amount).toBe(49);
    expect(summary.revenueByCategory.some((c) => c.category === "RESIDENCE_SUBSCRIPTION" && c.amount === 2000)).toBe(
      true,
    );
    expect(summary.mrr).toBe(2000 + 29 + 49 + 100);
  });

  it("computes daily revenue approx from total in window and range length", () => {
    const entries: RevenueLedgerEntry[] = [
      entry({
        id: "1",
        category: "RESIDENCE_SUBSCRIPTION",
        amount: 3000,
        occurredAt: new Date("2024-06-01T00:00:00.000Z"),
      }),
    ];
    const p = {
      start: new Date("2024-06-01T00:00:00.000Z"),
      end: new Date("2024-06-10T00:00:00.000Z"),
    };
    const s = buildSoinsRevenueSummary(entries, p);
    const days = (p.end.getTime() - p.start.getTime()) / 86400000;
    expect(s.dailyRevenueApprox).toBe(Math.round((3000 / days) * 100) / 100);
  });
});

describe("buildResidenceRevenueBreakdown", () => {
  it("splits listing, service, family, monitoring for one residence", () => {
    const residenceId = "res-1";
    const period = {
      start: new Date("2024-01-01"),
      end: new Date("2024-01-31"),
    };
    const entries: RevenueLedgerEntry[] = [
      entry({
        id: "1",
        residenceId,
        category: "LISTING_FEE",
        amount: 500,
        occurredAt: new Date("2024-01-05"),
      }),
      entry({
        id: "2",
        residenceId,
        category: "RESIDENCE_SUBSCRIPTION",
        amount: 2000,
        occurredAt: new Date("2024-01-06"),
      }),
      entry({
        id: "3",
        residenceId,
        category: "SERVICE_FEE",
        amount: 75,
        occurredAt: new Date("2024-01-07"),
      }),
      entry({
        id: "4",
        residenceId,
        category: "FAMILY_ADDON",
        amount: 24,
        occurredAt: new Date("2024-01-08"),
      }),
      entry({
        id: "5",
        residenceId,
        category: "MONITORING",
        amount: 49,
        occurredAt: new Date("2024-01-09"),
      }),
    ];

    const b = buildResidenceRevenueBreakdown(residenceId, entries, period);

    expect(b.listingAndSubscriptionFees).toBe(2500);
    expect(b.serviceFees).toBe(75);
    expect(b.familyAddonShare).toBe(24);
    expect(b.monitoringShare).toBe(49);
    expect(b.mrrContribution).toBe(2500 + 75 + 24 + 49);
  });
});

describe("buildFamilySubscriptionRevenueSummary", () => {
  it("rolls family addon revenue by serviceType key", () => {
    const period = {
      start: new Date("2024-03-01"),
      end: new Date("2024-03-31"),
    };
    const entries: RevenueLedgerEntry[] = [
      entry({
        id: "1",
        category: "FAMILY_ADDON",
        amount: 29,
        serviceType: "CAMERA_ACCESS",
        occurredAt: new Date("2024-03-10"),
      }),
      entry({
        id: "2",
        category: "FAMILY_ADDON",
        amount: 29,
        serviceType: "CAMERA_ACCESS",
        occurredAt: new Date("2024-03-15"),
      }),
      entry({
        id: "3",
        category: "FAMILY_ADDON",
        amount: 19,
        serviceType: "ADVANCED_ALERTS",
        occurredAt: new Date("2024-03-12"),
      }),
    ];

    const s = buildFamilySubscriptionRevenueSummary(entries, period, "CAD", 5);

    expect(s.totalFamilyAddonMrr).toBe(77);
    expect(s.byAddon.find((x) => x.addon === "CAMERA_ACCESS")?.mrr).toBe(58);
    expect(s.byAddon.find((x) => x.addon === "ADVANCED_ALERTS")?.mrr).toBe(19);
    expect(s.activeSubscriptionsApprox).toBe(5);
  });
});
