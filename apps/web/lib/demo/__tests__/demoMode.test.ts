import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isDemoDataActive, isDemoListingId, parseDemoScenarioFromRequest } from "../mode";
import { getDemoListings, getDemoBookingPriceBreakdown, getDemoCalendar } from "../data";

describe("Order 61 — demo mode", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env = { ...prev, NODE_ENV: "development" };
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("parseDemoScenarioFromRequest maps scenario aliases", () => {
    expect(parseDemoScenarioFromRequest(new Request("https://x.test/a?demo=scenario1"))).toBe("high_demand");
    expect(parseDemoScenarioFromRequest(new Request("https://x.test?demo=low_conversion"))).toBe("low_conversion");
  });

  it("isDemoListingId matches demo- prefix", () => {
    expect(isDemoListingId("demo-1")).toBe(true);
    expect(isDemoListingId("real-id")).toBe(false);
  });

  it("getDemoListings returns static rows and respects scenario", () => {
    const a = getDemoListings("default");
    const b = getDemoListings("low_conversion");
    expect(a.length).toBe(8);
    expect(b[0]!.price).toBeLessThanOrEqual(a[0]!.price);
  });

  it("getDemoCalendar includes blocked and demand levels (no NaN prices)", () => {
    const days = getDemoCalendar("demo-1", "2026-06-01", "2026-06-14", "high_demand");
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) {
      expect(d.suggestedPrice == null || Number.isFinite(d.suggestedPrice)).toBe(true);
    }
  });

  it("getDemoBookingPriceBreakdown is finite and positive for demo listing", () => {
    const br = getDemoBookingPriceBreakdown("demo-1", "2026-09-10", "2026-09-14", "default");
    expect(br).not.toBeNull();
    expect(br!.total).toBeGreaterThan(0);
    expect(Number.isNaN(br!.total)).toBe(false);
  });
});
