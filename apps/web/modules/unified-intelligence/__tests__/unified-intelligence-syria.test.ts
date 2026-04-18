import { describe, expect, it, vi } from "vitest";

const mockSyriaListing = vi.fn();
const mockSyriaStats = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    syriaRegionAdapterV1: true,
    regionListingKeyV1: true,
  },
}));

vi.mock("@/modules/integrations/regions/syria/syria-region-adapter.service", () => ({
  getListingById: (...args: unknown[]) => mockSyriaListing(...args),
  getBookingStats: (...args: unknown[]) => mockSyriaStats(...args),
  SYRIA_REGION_CODE: "sy",
}));

describe("unified-intelligence Syria branch", () => {
  it("returns Syria listing intel merged without throwing", async () => {
    mockSyriaListing.mockResolvedValue({
      listing: {
        id: "p1",
        source: "syria",
        regionCode: "sy",
        title: "t",
        description: "d",
        price: 100,
        currency: "SYP",
        listingType: "BNHUB",
        city: "x",
        ownerId: "o",
        status: "PUBLISHED",
        fraudFlag: true,
        isFeatured: false,
        featuredUntil: null,
        bookingCountHint: 2,
        payoutStateHint: "mixed" as const,
        createdAt: "",
        updatedAt: "",
      },
      availabilityNotes: [],
    });
    mockSyriaStats.mockResolvedValue({
      data: {
        bookingCount: 2,
        bookingsWithFraudFlag: 1,
        guestPaidCount: 1,
        payoutPendingCount: 1,
        payoutPaidCount: 0,
        cancelledCount: 0,
        sumTotalPriceHint: 50,
      },
      availabilityNotes: [],
    });

    const { getUnifiedListingIntelligence } = await import("../unified-intelligence.service");
    const out = await getUnifiedListingIntelligence({ listingId: "p1", source: "syria" });
    expect(out.sourceStatus.syria).toBe("available");
    expect(out.fraudFlag).toBe(true);
    expect(out.bookingCounts.total).toBe(2);
    expect(out.regionListingRef?.displayId?.startsWith("sy:syria:")).toBe(true);
  });
});
