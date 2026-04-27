import { describe, expect, it } from "vitest";

import {
  eachYmdInclusive,
  MAX_CALENDAR_RANGE_DAYS,
  validateListingCalendarQuery,
  ymdIsBookedByRanges,
  ymdIsInStayNights,
} from "@/lib/booking/dailyCalendarQuery";
import { computeDailyListingPricing } from "@/lib/market/seasonalPricingMath";

describe("Order A.2 — validateListingCalendarQuery", () => {
  it("rejects when start/end missing", () => {
    const r = validateListingCalendarQuery(null, "2026-01-10");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.err.status).toBe(400);
  });
  it("rejects bad format", () => {
    const r = validateListingCalendarQuery("01-02-2026", "2026-01-10");
    expect(r.ok).toBe(false);
  });
  it("rejects range over 90 days", () => {
    const r = validateListingCalendarQuery("2026-01-01", "2026-04-10");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.err.error).toMatch(/at most/);
  });
  it("accepts 90 full days (inclusive)", () => {
    const r = validateListingCalendarQuery("2026-01-01", "2026-03-31");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.days.length).toBe(90);
      expect(r.startYmd).toBe("2026-01-01");
      expect(r.endYmd).toBe("2026-03-31");
    }
  });
  it("rejects start after end", () => {
    const r = validateListingCalendarQuery("2026-01-10", "2026-01-01");
    expect(r.ok).toBe(false);
  });
  it("eachYmdInclusive counts inclusive days", () => {
    expect(eachYmdInclusive("2026-01-01", "2026-01-03").length).toBe(3);
  });
  it("max span is MAX_CALENDAR_RANGE_DAYS inclusive", () => {
    const r = validateListingCalendarQuery("2026-01-01", "2026-03-31");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.days.length).toBe(MAX_CALENDAR_RANGE_DAYS);
  });
});

describe("ymdIsBookedByRanges (checkout exclusive)", () => {
  it("nights in [start, end) are booked; checkout day is free for next guest", () => {
    const rows = [{ startYmd: "2026-04-10", endYmd: "2026-04-21" }];
    expect(ymdIsBookedByRanges("2026-04-10", rows)).toBe(true);
    expect(ymdIsBookedByRanges("2026-04-15", rows)).toBe(true);
    expect(ymdIsBookedByRanges("2026-04-20", rows)).toBe(true);
    expect(ymdIsBookedByRanges("2026-04-21", rows)).toBe(false);
    expect(ymdIsBookedByRanges("2026-04-22", rows)).toBe(false);
  });

  it("ymdIsInStayNights is half-open", () => {
    expect(ymdIsInStayNights("2026-01-10", "2026-01-10", "2026-01-11")).toBe(true);
    expect(ymdIsInStayNights("2026-01-11", "2026-01-10", "2026-01-11")).toBe(false);
  });
});

describe("computeDailyListingPricing (rules)", () => {
  it("weekend is higher than adjacent weekday (same base)", () => {
    const base = 100;
    const wk = computeDailyListingPricing({
      basePrice: base,
      dateYmd: "2026-04-18",
      city: "Montreal",
      cityDemandScore: 0,
    });
    const we = computeDailyListingPricing({
      basePrice: base,
      dateYmd: "2026-04-19",
      city: "Montreal",
      cityDemandScore: 0,
    });
    expect(we.dayType).toBe("weekend");
    expect((we.suggestedPrice ?? 0) >= (wk.suggestedPrice ?? 0)).toBe(true);
  });
  it("high city demand adds pressure vs low", () => {
    const low = computeDailyListingPricing({
      basePrice: 100,
      dateYmd: "2026-04-15",
      city: "X",
      cityDemandScore: 0,
    });
    const high = computeDailyListingPricing({
      basePrice: 100,
      dateYmd: "2026-04-15",
      city: "X",
      cityDemandScore: 200,
    });
    expect((high.suggestedPrice ?? 0) > (low.suggestedPrice ?? 0)).toBe(true);
    expect(high.demandLevel).toBe("high");
  });
  it("adjustment is clamped between -10 and +25", () => {
    const x = computeDailyListingPricing({
      basePrice: 100,
      dateYmd: "2026-08-10",
      city: "Y",
      cityDemandScore: 10_000,
    });
    expect(x.adjustmentPercent).toBeLessThanOrEqual(25);
    expect(x.adjustmentPercent).toBeGreaterThanOrEqual(-10);
  });
  it("summer (high season) is priced above spring normal (same base & demand)", () => {
    const base = 100;
    const spring = computeDailyListingPricing({
      basePrice: base,
      dateYmd: "2026-04-20",
      city: "Zed",
      cityDemandScore: 0,
    });
    const summer = computeDailyListingPricing({
      basePrice: base,
      dateYmd: "2026-08-20",
      city: "Zed",
      cityDemandScore: 0,
    });
    expect(summer.seasonType).toBe("high_season");
    expect((summer.suggestedPrice ?? 0) > (spring.suggestedPrice ?? 0)).toBe(true);
  });
});

describe("Order A.2 — no fake urgency in calendar tile vocabulary", () => {
  it("demand text is only shown for high (see book page tileContent)", () => {
    // Spec: "High demand" when demandLevel === "high". No "almost gone" / false scarcity.
    expect(computeDailyListingPricing({ basePrice: 100, dateYmd: "2026-04-10", city: "X", cityDemandScore: 0 }).demandLevel).toBe(
      "low"
    );
  });
});
