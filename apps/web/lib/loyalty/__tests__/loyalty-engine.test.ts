import { describe, it, expect } from "vitest";
import {
  loyaltyTierFromCompletedBookings,
  loyaltyDiscountCentsFromPercent,
  pickBestLodgingDiscount,
} from "../loyalty-engine";

describe("loyalty-engine", () => {
  it("first-time guest has no discount", () => {
    const t = loyaltyTierFromCompletedBookings(0);
    expect(t.tier).toBe("NONE");
    expect(t.discountPercent).toBe(0);
  });

  it("maps tiers to deterministic percents", () => {
    expect(loyaltyTierFromCompletedBookings(1).discountPercent).toBe(3);
    expect(loyaltyTierFromCompletedBookings(2).discountPercent).toBe(5);
    expect(loyaltyTierFromCompletedBookings(3).discountPercent).toBe(5);
    expect(loyaltyTierFromCompletedBookings(4).discountPercent).toBe(8);
  });

  it("pickBestLodgingDiscount chooses higher cents and ties prefer loyalty", () => {
    expect(
      pickBestLodgingDiscount({
        subtotalCents: 10000,
        earlyDiscountCents: 500,
        loyaltyDiscountCents: 800,
      }).source,
    ).toBe("LOYALTY");
    expect(
      pickBestLodgingDiscount({
        subtotalCents: 10000,
        earlyDiscountCents: 800,
        loyaltyDiscountCents: 500,
      }).source,
    ).toBe("EARLY_BOOKING");
    const tie = pickBestLodgingDiscount({
      subtotalCents: 10000,
      earlyDiscountCents: 500,
      loyaltyDiscountCents: 500,
    });
    expect(tie.source).toBe("LOYALTY");
    expect(tie.appliedCents).toBe(500);
  });

  it("loyaltyDiscountCentsFromPercent is bounded", () => {
    expect(loyaltyDiscountCentsFromPercent(10000, 10)).toBe(1000);
    expect(loyaltyDiscountCentsFromPercent(100, 100)).toBeLessThan(100);
  });
});
