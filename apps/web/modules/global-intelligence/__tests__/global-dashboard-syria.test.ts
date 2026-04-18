import { describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: queryRaw,
    listing: {
      count: vi.fn().mockResolvedValue(42),
    },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    syriaRegionAdapterV1: true,
  },
}));

describe("global-dashboard Syria augmentation", () => {
  it("buildSyriaDashboardAugmentation merges comparison rows without throwing", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        total_listings: 3n,
        pending_review: 1n,
        featured: 1n,
        fraud_flagged: 0n,
        total_bookings: 7n,
        cancelled_bookings: 0n,
        bnhub_listings: 2n,
        booking_gross: "900",
        payouts_pending: 1n,
        payouts_approved: 0n,
        payouts_paid: 1n,
        listing_payments_verified: 0n,
      },
    ]);

    const { buildSyriaDashboardAugmentation } = await import("../global-dashboard.service");
    const aug = await buildSyriaDashboardAugmentation();
    expect(aug.kpisSyria?.availability).toBe("available");
    expect(aug.regionComparison.some((r) => r.regionCode === "sy")).toBe(true);
    expect(aug.regionComparison.some((r) => r.regionCode === "web_crm")).toBe(true);
  });
});
