import { describe, expect, it } from "vitest";
import {
  normalizeSyriaListing,
  normalizeSyriaRegionSummary,
  normalizeSyriaUser,
} from "../syria-normalizer.service";
import type { SyriaListingReadRow } from "../syria-read-adapter.service";

describe("syria-normalizer.service", () => {
  it("normalizeSyriaListing maps fields deterministically", () => {
    const row: SyriaListingReadRow = {
      id: "x",
      title: "title",
      description: "desc",
      titleAr: "title",
      titleEn: null,
      descriptionAr: "desc",
      descriptionEn: null,
      price: 12,
      currency: "SYP",
      type: "SALE",
      city: "Aleppo",
      cityAr: null,
      cityEn: null,
      districtAr: null,
      districtEn: null,
      ownerId: "o1",
      status: "DRAFT",
      fraudFlag: false,
      isFeatured: false,
      featuredUntil: null,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      updatedAt: new Date("2026-02-02T00:00:00.000Z"),
      bookingCount: 1,
    };
    const out = normalizeSyriaListing(row, {
      bookingCount: 2,
      bookingsWithFraudFlag: 0,
      guestPaidCount: 1,
      payoutPendingCount: 1,
      payoutPaidCount: 0,
      cancelledCount: 0,
      sumTotalPriceHint: 100,
    });
    expect(out?.source).toBe("syria");
    expect(out?.regionCode).toBe("sy");
    expect(out?.listingType).toBe("SALE");
    expect(out?.payoutStateHint).toBe("mixed");
  });

  it("normalizeSyriaRegionSummary clamps negatives", () => {
    const out = normalizeSyriaRegionSummary({
      totalListings: -1,
      pendingReviewListings: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      totalBookings: 0,
      cancelledBookings: 0,
      bnhubStaysListings: 0,
      bookingGrossHint: null,
      payoutsPending: 0,
      payoutsApproved: 0,
      payoutsPaid: 0,
      listingPaymentsVerifiedHint: 0,
    });
    expect(out?.totalListings).toBe(0);
  });

  it("normalizeSyriaUser returns null for empty id", () => {
    expect(normalizeSyriaUser(null, null)).toBeNull();
  });
});
