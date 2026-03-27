import { describe, it, expect } from "vitest";
import {
  computeAddonLineCents,
  catalogAddonAllowedForListing,
  suggestAddonServiceCodes,
} from "../hospitality-addons";

describe("hospitality add-ons", () => {
  it("computes FIXED and PER_DAY lines", () => {
    const fixed = computeAddonLineCents("FIXED", 1000, 3, 2, 2, false);
    expect(fixed.unitPriceCents).toBe(1000);
    expect(fixed.totalPriceCents).toBe(2000);

    const perDay = computeAddonLineCents("PER_DAY", 500, 4, 2, 1, false);
    expect(perDay.totalPriceCents).toBe(2000);
  });

  it("returns zero for included or FREE", () => {
    const inc = computeAddonLineCents("FIXED", 9999, 5, 4, 3, true);
    expect(inc.totalPriceCents).toBe(0);
    const free = computeAddonLineCents("FREE", 0, 5, 4, 3, false);
    expect(free.totalPriceCents).toBe(0);
  });

  it("blocks premium on HIGH risk", () => {
    expect(
      catalogAddonAllowedForListing({
        isPremiumTier: true,
        minListingTrustScore: null,
        listingTrustScore: 80,
        overallRiskLevel: "HIGH",
      })
    ).toBe(false);
    expect(
      catalogAddonAllowedForListing({
        isPremiumTier: true,
        minListingTrustScore: null,
        listingTrustScore: 80,
        overallRiskLevel: "LOW",
      })
    ).toBe(true);
  });

  it("enforces min listing trust score", () => {
    expect(
      catalogAddonAllowedForListing({
        isPremiumTier: false,
        minListingTrustScore: 50,
        listingTrustScore: 40,
        overallRiskLevel: "LOW",
      })
    ).toBe(false);
  });

  it("suggests luxury and family packs", () => {
    const lux = suggestAddonServiceCodes({
      propertyType: "Luxury Villa",
      city: "Miami",
      familyFriendly: false,
      experienceTags: [],
    });
    expect(lux).toContain("spa_service");

    const fam = suggestAddonServiceCodes({
      propertyType: "House",
      city: "Quebec",
      familyFriendly: true,
      experienceTags: [],
    });
    expect(fam).toContain("laundry_service");
  });
});
