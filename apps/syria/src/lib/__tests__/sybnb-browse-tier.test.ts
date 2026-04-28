import { describe, expect, it } from "vitest";
import { computeSybnbBrowseTier } from "@/lib/sybnb/sybnb-browse-tier";

describe("computeSybnbBrowseTier (SYBNB-42)", () => {
  it("puts verified subscribed hotels in tier 4", () => {
    expect(
      computeSybnbBrowseTier({
        type: "HOTEL",
        plan: "hotel_featured",
        listingVerified: true,
        verified: false,
        fraudFlag: false,
      }),
    ).toBe(4);
  });

  it("does not grant tier 4 without verification", () => {
    expect(
      computeSybnbBrowseTier({
        type: "HOTEL",
        plan: "hotel_featured",
        listingVerified: false,
        verified: false,
        fraudFlag: false,
      }),
    ).toBe(3);
  });

  it("puts featured listings in tier 3", () => {
    expect(
      computeSybnbBrowseTier({
        type: "RENT",
        plan: "featured",
        listingVerified: false,
        verified: false,
        fraudFlag: false,
      }),
    ).toBe(3);
  });

  it("puts verified free listings in tier 2", () => {
    expect(
      computeSybnbBrowseTier({
        type: "RENT",
        plan: "free",
        listingVerified: true,
        verified: false,
        fraudFlag: false,
      }),
    ).toBe(2);
  });

  it("defaults unverified free to tier 1", () => {
    expect(
      computeSybnbBrowseTier({
        type: "RENT",
        plan: "free",
        listingVerified: false,
        verified: false,
        fraudFlag: false,
      }),
    ).toBe(1);
  });

  it("forces fraud-flagged to tier 0", () => {
    expect(
      computeSybnbBrowseTier({
        type: "RENT",
        plan: "free",
        listingVerified: false,
        verified: false,
        fraudFlag: true,
      }),
    ).toBe(0);
  });
});
