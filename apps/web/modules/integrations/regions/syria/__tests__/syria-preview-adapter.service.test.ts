import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  engineFlags: { syriaRegionAdapterV1: true },
}));

vi.mock("@/modules/integrations/regions/syria/syria-region-adapter.service", () => ({
  getListingById: vi.fn(() =>
    Promise.resolve({
      listing: {
        id: "p1",
        source: "syria",
        regionCode: "sy",
        title: "A",
        description: "d",
        price: 10,
        currency: "SYP",
        listingType: "X",
        city: "C",
        ownerId: "o",
        status: "LIVE",
        fraudFlag: false,
        isFeatured: true,
        featuredUntil: null,
        bookingCountHint: 0,
        payoutStateHint: "clear" as const,
        createdAt: "",
        updatedAt: "",
      },
      availabilityNotes: [],
    }),
  ),
  getBookingStats: vi.fn(() => ({
    data: {
      bookingCount: 0,
      bookingsWithFraudFlag: 0,
      guestPaidCount: 0,
      payoutPendingCount: 0,
      payoutPaidCount: 0,
      cancelledCount: 0,
      sumTotalPriceHint: 0,
    },
    availabilityNotes: [] as string[],
  })),
  SYRIA_REGION_CODE: "sy",
}));

describe("syria-preview-adapter.service", () => {
  it("buildSyriaListingObservationSnapshot returns syria_listing target", async () => {
    const { buildSyriaListingObservationSnapshot } = await import("../syria-preview-adapter.service");
    const out = await buildSyriaListingObservationSnapshot("p1");
    expect(out.observation?.target.type).toBe("syria_listing");
    expect(out.metrics?.listingStatus).toBe("LIVE");
  });
});
