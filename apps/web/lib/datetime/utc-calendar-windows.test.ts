import { describe, expect, it } from "vitest";
import { startOfUtcDay, startOfUtcIsoWeekMonday, startOfUtcMonth } from "./utc-calendar-windows";

/**
 * Admin Management Hub “Daily (today, UTC)” uses `startOfUtcDay` → `getManagementHubMoneySnapshot` window [dayStart, now].
 */
describe("UTC calendar windows (daily / weekly / monthly income bounds)", () => {
  it("startOfUtcDay is 00:00:00.000 UTC for the same calendar date", () => {
    const d = new Date(Date.UTC(2026, 3, 15, 14, 30, 45, 123));
    expect(startOfUtcDay(d).toISOString()).toBe("2026-04-15T00:00:00.000Z");
  });

  it("startOfUtcIsoWeekMonday: Monday 00:00 UTC for a Wednesday in the same week", () => {
    const wed = new Date(Date.UTC(2026, 3, 15, 12, 0, 0));
    expect(startOfUtcIsoWeekMonday(wed).toISOString()).toBe("2026-04-13T00:00:00.000Z");
  });

  it("startOfUtcIsoWeekMonday: Sunday maps to previous Monday", () => {
    const sun = new Date(Date.UTC(2026, 3, 19, 8, 0, 0));
    expect(startOfUtcIsoWeekMonday(sun).toISOString()).toBe("2026-04-13T00:00:00.000Z");
  });

  it("startOfUtcMonth is first day 00:00 UTC", () => {
    const d = new Date(Date.UTC(2026, 3, 22, 23, 59, 59));
    expect(startOfUtcMonth(d).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });
});
