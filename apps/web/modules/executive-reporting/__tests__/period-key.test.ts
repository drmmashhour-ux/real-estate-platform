import { describe, expect, it } from "vitest";
import { formatUtcIsoWeekKey, formatUtcMonthKey, parsePeriodKey, previousPeriodBounds } from "../period-key";

describe("period-key", () => {
  it("parses monthly keys", () => {
    const p = parsePeriodKey("2026-04");
    expect(p?.kind).toBe("MONTHLY");
    expect(p?.startUtc.toISOString().startsWith("2026-04-01")).toBe(true);
    expect(p?.endUtcExclusive.toISOString().startsWith("2026-05-01")).toBe(true);
  });

  it("parses weekly keys", () => {
    const p = parsePeriodKey("2026-W17");
    expect(p?.kind).toBe("WEEKLY");
    expect(p?.endUtcExclusive.getTime() - p!.startUtc.getTime()).toBe(7 * 86400000);
  });

  it("returns null for invalid input", () => {
    expect(parsePeriodKey("")).toBeNull();
    expect(parsePeriodKey("2026-13")).toBeNull();
    expect(parsePeriodKey("bad")).toBeNull();
  });

  it("previousPeriodBounds for monthly", () => {
    const cur = parsePeriodKey("2026-04")!;
    const prev = previousPeriodBounds(cur);
    expect(prev.startUtc.toISOString().startsWith("2026-03-01")).toBe(true);
    expect(prev.endUtcExclusive.toISOString().startsWith("2026-04-01")).toBe(true);
  });

  it("formats month key in UTC", () => {
    const d = new Date(Date.UTC(2026, 3, 15));
    expect(formatUtcMonthKey(d)).toBe("2026-04");
  });

  it("formats ISO week key without throwing", () => {
    const d = new Date(Date.UTC(2026, 3, 15));
    expect(formatUtcIsoWeekKey(d)).toMatch(/^\d{4}-W\d{2}$/);
  });
});
