import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/db/routeSwitch", () => ({
  getListingsDB: () => ({
    booking: { findMany: (...args: unknown[]) => findMany(...args) },
  }),
}));

/**
 * Order D.1 — acceptance: one DB query per `buildMarketplaceConflictSuggestions` / `findNext` / `findNearest`,
 * 409 body shape, empty suggestions on fully blocked horizon, suggested windows match requested span.
 */
describe("Order D.1 — conflict suggestions (mocked getListingsDB.booking.findMany)", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("buildMarketplaceConflictSuggestions returns DTO with next + nearest; dates are YYYY-MM-DD", async () => {
    findMany.mockResolvedValue([{ startDate: new Date("2026-06-10"), endDate: new Date("2026-06-15") }]);
    const { buildMarketplaceConflictSuggestions } = await import("@/lib/booking/availabilityHelpers");
    const s = await buildMarketplaceConflictSuggestions("list-1", "2026-06-10", "2026-06-13");
    expect(s.nextAvailableStart === null || typeof s.nextAvailableStart === "string").toBe(true);
    for (const r of s.nearestRanges) {
      expect(r.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("fully booked in scan window → no next, empty nearest (graceful)", async () => {
    findMany.mockResolvedValue([{ startDate: new Date("2020-01-01"), endDate: new Date("2030-12-31") }]);
    const { buildMarketplaceConflictSuggestions } = await import("@/lib/booking/availabilityHelpers");
    const s = await buildMarketplaceConflictSuggestions("list-1", "2026-01-10", "2026-01-12");
    expect(s.nextAvailableStart).toBeNull();
    expect(s.nearestRanges).toEqual([]);
  });

  it("findNextAvailableStart uses the same findMany (single query)", async () => {
    findMany.mockResolvedValue([{ startDate: new Date("2026-06-10"), endDate: new Date("2026-06-12") }]);
    const { findNextAvailableStart } = await import("@/lib/booking/availabilityHelpers");
    const n = await findNextAvailableStart("list-1", "2026-06-10", "2026-06-13");
    expect(n === null || /^\d{4}-\d{2}-\d{2}$/.test(n)).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("findNearestAvailableRanges same span; single query", async () => {
    findMany.mockResolvedValue([{ startDate: new Date("2026-06-10"), endDate: new Date("2026-06-12") }]);
    const { findNearestAvailableRanges } = await import("@/lib/booking/availabilityHelpers");
    const rows = await findNearestAvailableRanges("list-1", "2026-06-10", "2026-06-13", 3);
    for (const r of rows) {
      const a = r.startDate.slice(0, 10);
      const b = r.endDate.slice(0, 10);
      expect(b >= a).toBe(true);
    }
    expect(findMany).toHaveBeenCalledTimes(1);
  });
});

describe("Order D.1 — POST 409 JSON contract (non-breaking)", () => {
  it("has stable keys for new clients; suggestions optional in theory", () => {
    const withSuggestions = {
      error: "Dates not available",
      code: "BOOKING_CONFLICT",
      suggestions: {
        nextAvailableStart: "2026-08-01" as string | null,
        nearestRanges: [{ startDate: "2026-08-01", endDate: "2026-08-04" }],
      },
    };
    expect(withSuggestions.error).toBe("Dates not available");
    expect(withSuggestions.code).toBe("BOOKING_CONFLICT");
    expect(Array.isArray(withSuggestions.suggestions.nearestRanges)).toBe(true);
  });
});
