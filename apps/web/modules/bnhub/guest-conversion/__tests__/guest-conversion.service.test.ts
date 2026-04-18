import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildGuestConversionSummary } from "../guest-conversion.service";
import { resetGuestConversionMonitoringForTests } from "../guest-conversion-monitoring.service";

vi.mock("@/config/feature-flags", () => ({
  bnhubGuestConversionFlags: {
    guestConversionV1: true,
    bookingFrictionV1: true,
    recommendationsV1: true,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../search-conversion.service", () => ({
  buildSearchConversionMetrics: vi.fn().mockResolvedValue({
    metrics: { clicks: 2, impressions: 20, clickThroughRate: 10 },
    dataNotes: [],
  }),
}));

vi.mock("../listing-conversion.service", () => ({
  buildListingConversionMetrics: vi.fn().mockResolvedValue({
    metrics: {
      listingViews: 10,
      bookingStarts: 1,
      bookingCompletions: 1,
      viewToStartRate: 10,
      startToBookingRate: 100,
    },
    dataNotes: [],
  }),
}));

import { prisma } from "@/lib/db";

describe("buildGuestConversionSummary", () => {
  beforeEach(() => {
    resetGuestConversionMonitoringForTests();
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      id: "l1",
      nightPriceCents: 5000,
      description: "x".repeat(50),
      photos: [],
      bnhubListingReviewCount: 2,
      _count: { listingPhotos: 4 },
    } as never);
  });

  it("returns a summary without mutating prisma inputs", async () => {
    const sum = await buildGuestConversionSummary("l1");
    expect(sum.listingId).toBe("l1");
    expect(sum.status).toBeDefined();
    expect(sum.createdAt).toMatch(/\d{4}-/);
    expect(Array.isArray(sum.frictionSignals)).toBe(true);
    expect(Array.isArray(sum.recommendations)).toBe(true);
  });

  it("handles missing listing", async () => {
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(null);
    const sum = await buildGuestConversionSummary("missing");
    expect(sum.status).toBe("weak");
    expect(sum.weakSignals.length).toBeGreaterThan(0);
  });
});
