import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildHostPerformanceSummary } from "../host-performance.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findMany: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("buildHostPerformanceSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds summary without mutating prisma inputs", async () => {
    const updatedAt = new Date();
    vi.mocked(prisma.shortTermListing.findMany).mockResolvedValue([
      {
        id: "lst_1",
        title: "Test stay",
        nightPriceCents: 10_000,
        maxGuests: 4,
        description: "A comfortable place with enough text for quality scoring here.",
        amenities: ["wifi", "kitchen", "parking"],
        photos: ["a", "b", "c", "d"],
        updatedAt,
        createdAt: updatedAt,
        city: "Montreal",
        _count: { reviews: 2, bookings: 1 },
      },
    ] as never);
    vi.mocked(prisma.review.groupBy).mockResolvedValue([
      { listingId: "lst_1", _avg: { propertyRating: 4.5 } },
    ] as never);

    const summary = await buildHostPerformanceSummary("host_1");
    expect(summary.totalListings).toBe(1);
    expect(summary.listings[0]?.listingId).toBe("lst_1");
    expect(summary.listings[0]?.rankingScore).toBeDefined();
    expect(prisma.shortTermListing.findMany).toHaveBeenCalled();
  });

  it("returns empty summary when no listings", async () => {
    vi.mocked(prisma.shortTermListing.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.review.groupBy).mockResolvedValue([] as never);
    const summary = await buildHostPerformanceSummary("host_x");
    expect(summary.totalListings).toBe(0);
    expect(summary.listings).toEqual([]);
  });
});
