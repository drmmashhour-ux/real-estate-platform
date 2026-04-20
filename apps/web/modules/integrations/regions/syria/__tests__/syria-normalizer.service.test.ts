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

  it("normalizeSyriaListing carries bilingual fields and localization notes", () => {
    const row: SyriaListingReadRow = {
      id: "p1",
      title: "عربي",
      description: "وصف عربي",
      titleAr: "عربي",
      titleEn: "English title",
      descriptionAr: "وصف عربي",
      descriptionEn: null,
      price: 100,
      currency: "SYP",
      type: "RENT",
      city: "Damascus",
      cityAr: "دمشق",
      cityEn: "Damascus",
      districtAr: "المزة",
      districtEn: "Mazzeh",
      ownerId: "u1",
      status: "PUBLISHED",
      fraudFlag: false,
      isFeatured: true,
      featuredUntil: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      bookingCount: 0,
    };
    const out = normalizeSyriaListing(row);
    expect(out?.titleAr).toBe("عربي");
    expect(out?.titleEn).toBe("English title");
    expect(out?.descriptionEn).toBeNull();
    expect(out?.cityAr).toBe("دمشق");
    expect(out?.districtEn).toBe("Mazzeh");
    expect(out?.localizationNotes).toContain("en_description_absent");
    expect(out?.localizationNotes).toContain("en_title_present");
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
