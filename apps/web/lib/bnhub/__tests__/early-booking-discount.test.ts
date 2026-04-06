import { describe, it, expect } from "vitest";
import {
  PRICING_RULE_TYPE_EARLY_BOOKING,
  parseEarlyBookingPayload,
  resolveEarlyBookingDiscount,
} from "../early-booking-discount";

describe("parseEarlyBookingPayload", () => {
  it("accepts valid payload", () => {
    expect(parseEarlyBookingPayload({ minLeadDays: 14, discountPercent: 8 })).toEqual({
      minLeadDays: 14,
      discountPercent: 8,
    });
  });

  it("rejects out-of-range", () => {
    expect(parseEarlyBookingPayload({ minLeadDays: 0, discountPercent: 5 })).toBeNull();
    expect(parseEarlyBookingPayload({ minLeadDays: 14, discountPercent: 40 })).toBeNull();
  });
});

describe("resolveEarlyBookingDiscount", () => {
  const asOf = new Date(Date.UTC(2025, 5, 1, 12, 0, 0));

  it("returns null when lead time too short", () => {
    const r = resolveEarlyBookingDiscount({
      grossNightlySubtotalCents: 50_000,
      checkInIsoDate: "2025-06-10",
      rules: [
        {
          ruleType: PRICING_RULE_TYPE_EARLY_BOOKING,
          payload: { minLeadDays: 30, discountPercent: 10 },
          validFrom: null,
          validTo: null,
        },
      ],
      pricingAsOf: asOf,
    });
    expect(r).toBeNull();
  });

  it("applies best discount when multiple rules", () => {
    const r = resolveEarlyBookingDiscount({
      grossNightlySubtotalCents: 100_000,
      checkInIsoDate: "2025-08-01",
      rules: [
        {
          ruleType: PRICING_RULE_TYPE_EARLY_BOOKING,
          payload: { minLeadDays: 7, discountPercent: 5 },
          validFrom: null,
          validTo: null,
        },
        {
          ruleType: PRICING_RULE_TYPE_EARLY_BOOKING,
          payload: { minLeadDays: 7, discountPercent: 12 },
          validFrom: null,
          validTo: null,
        },
      ],
      pricingAsOf: asOf,
    });
    expect(r?.discountCents).toBe(12_000);
    expect(r?.appliedPercent).toBe(12);
  });

  it("respects check-in window", () => {
    const r = resolveEarlyBookingDiscount({
      grossNightlySubtotalCents: 100_000,
      checkInIsoDate: "2025-08-01",
      rules: [
        {
          ruleType: PRICING_RULE_TYPE_EARLY_BOOKING,
          payload: { minLeadDays: 7, discountPercent: 10 },
          validFrom: new Date(Date.UTC(2025, 8, 1)),
          validTo: null,
        },
      ],
      pricingAsOf: asOf,
    });
    expect(r).toBeNull();
  });
});
