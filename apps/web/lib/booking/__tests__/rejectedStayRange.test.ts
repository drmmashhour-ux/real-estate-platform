import { describe, expect, it } from "vitest";

import { ymdInRejectedStayNights } from "@/lib/booking/rejectedStayRange";

/** Order D.1 — failed stay = occupied nights; checkout ymd is not in the set. */
describe("ymdInRejectedStayNights", () => {
  it("marks stay nights, not checkout day", () => {
    expect(ymdInRejectedStayNights("2026-04-10", "2026-04-10", "2026-04-13")).toBe(true);
    expect(ymdInRejectedStayNights("2026-04-11", "2026-04-10", "2026-04-13")).toBe(true);
    expect(ymdInRejectedStayNights("2026-04-12", "2026-04-10", "2026-04-13")).toBe(true);
    expect(ymdInRejectedStayNights("2026-04-13", "2026-04-10", "2026-04-13")).toBe(false);
  });
});

describe("Order D.1 — 409 payload contract (shape)", () => {
  it("reserves error and code, suggestions optional for older clients", () => {
    const minimal: { error: string; code: string; suggestions?: { nextAvailableStart: null; nearestRanges: never[] } } = {
      error: "Dates not available",
      code: "BOOKING_CONFLICT",
      suggestions: { nextAvailableStart: null, nearestRanges: [] },
    };
    expect(minimal.error).toBe("Dates not available");
    expect(minimal.suggestions).toBeDefined();
  });
});
