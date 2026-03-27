import { describe, expect, it } from "vitest";
import { calculateBookingTotalCents } from "@/src/modules/bnhub/application/bookingService";
import { completenessScore, scoreFromReviews, verificationScore } from "@/src/modules/bnhub/application/trustService";

describe("bnhub booking pricing", () => {
  it("calculates total correctly", () => {
    const total = calculateBookingTotalCents({
      nights: 3,
      pricePerNightCents: 12000,
      cleaningFeeCents: 3000,
      depositCents: 10000,
    });
    expect(total).toBe(49000);
  });
});

describe("bnhub trust score primitives", () => {
  it("scores completeness from required fields", () => {
    expect(
      completenessScore({
        title: "T",
        description: "D",
        address: "A",
        photos: ["1"],
        amenities: ["wifi"],
        houseRules: "No parties",
      })
    ).toBe(100);
  });

  it("scores reviews with fallback", () => {
    expect(scoreFromReviews([])).toBe(40);
    expect(scoreFromReviews([5, 4, 5])).toBeGreaterThan(80);
  });

  it("scores verification status", () => {
    expect(verificationScore("VERIFIED")).toBe(100);
    expect(verificationScore("PENDING")).toBe(45);
    expect(verificationScore("REJECTED")).toBe(0);
  });
});

