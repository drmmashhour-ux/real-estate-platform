import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const prismaMock = { $queryRaw: queryRaw };

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: { syriaRegionAdapterV1: true },
}));

describe("syria-read-adapter.service", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("returns missing id notes without throwing", async () => {
    const mod = await import("../syria-read-adapter.service");
    const out = await mod.getSyriaListingById("  ");
    expect(out.data).toBeNull();
    expect(out.availabilityNotes).toContain("syria_listing_id_missing");
  });

  it("getSyriaListingById returns mapping without throwing", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        id: "p1",
        title_ar: "T",
        title_en: null,
        description_ar: "D",
        description_en: null,
        price: "100.5",
        currency: "SYP",
        type: "BNHUB",
        city: "Damascus",
        city_ar: null,
        city_en: null,
        district_ar: null,
        district_en: null,
        owner_id: "u1",
        status: "PUBLISHED",
        fraud_flag: false,
        is_featured: true,
        featured_until: null,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-02T00:00:00.000Z"),
        booking_count: 3n,
      },
    ]);

    const mod = await import("../syria-read-adapter.service");
    const res = await mod.getSyriaListingById("p1");
    expect(res.data?.id).toBe("p1");
    expect(res.data?.bookingCount).toBe(3);
    expect(res.availabilityNotes.length).toBe(0);
  });

  it("listSyriaListingsSummary maps aggregate row", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        total_listings: 2n,
        pending_review: 1n,
        featured: 0n,
        fraud_flagged: 0n,
        total_bookings: 5n,
        cancelled_bookings: 1n,
        bnhub_listings: 1n,
        booking_gross: "500",
        payouts_pending: 1n,
        payouts_approved: 0n,
        payouts_paid: 2n,
        listing_payments_verified: 1n,
      },
    ]);

    const mod = await import("../syria-read-adapter.service");
    const res = await mod.listSyriaListingsSummary();
    expect(res.data?.totalListings).toBe(2);
    expect(res.data?.bookingGrossHint).toBe(500);
  });

  it("surfaces empty availability on query failure without throwing", async () => {
    queryRaw.mockRejectedValueOnce(new Error("db"));
    const mod = await import("../syria-read-adapter.service");
    const res = await mod.listSyriaListingsSummary();
    expect(res.data).toBeNull();
    expect(res.availabilityNotes.join()).toContain("syria_summary_query_failed");
  });
});
