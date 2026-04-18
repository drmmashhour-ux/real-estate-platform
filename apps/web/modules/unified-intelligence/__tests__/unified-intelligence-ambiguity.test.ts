import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/integrations/regions/syria/syria-region-adapter.service", () => ({
  getListingById: vi.fn(),
  getBookingStats: vi.fn(() => ({
    data: null,
    availabilityNotes: [],
  })),
  SYRIA_REGION_CODE: "sy",
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    syriaRegionAdapterV1: true,
    regionListingKeyV1: true,
  },
}));

describe("unified-intelligence ambiguity (web missing, Syria exists)", () => {
  it("does not guess region — emits ambiguity notes only", async () => {
    const adapter = await import("@/modules/integrations/regions/syria/syria-region-adapter.service");
    vi.mocked(adapter.getListingById).mockResolvedValue({
      listing: {
        id: "ambiguous_1",
        source: "syria",
        regionCode: "sy",
        title: "",
        description: "",
        price: 1,
        currency: "SYP",
        listingType: "x",
        city: "",
        ownerId: "o",
        status: "PUBLISHED",
        fraudFlag: false,
        isFeatured: false,
        featuredUntil: null,
        bookingCountHint: 0,
        payoutStateHint: "clear",
        createdAt: "",
        updatedAt: "",
      },
      availabilityNotes: [],
    });

    const { getUnifiedListingIntelligence } = await import("../unified-intelligence.service");
    const out = await getUnifiedListingIntelligence({ listingId: "ambiguous_1" });
    expect(out.source).toBe("web");
    expect(out.availabilityNotes.some((n) => n.includes("ambiguous"))).toBe(true);
    expect(out.availabilityNotes.some((n) => n.includes("explicit_source_syria"))).toBe(true);
  });
});
