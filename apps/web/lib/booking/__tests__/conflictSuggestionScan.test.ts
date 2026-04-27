import { describe, expect, it } from "vitest";

import {
  mergeBookingYmd,
  scanNearestAvailableRanges,
  scanNextAvailableStart,
} from "@/lib/booking/conflictSuggestionScan";

describe("Order D.1 — conflict suggestion scan (inclusive range, no per-day DB)", () => {
  it("fully booked horizon → no next, no ranges", () => {
    const merged = mergeBookingYmd([{ startYmd: "2026-01-01", endYmd: "2027-12-31" }]);
    expect(scanNextAvailableStart(merged, "2026-06-10", "2026-06-12")).toBeNull();
    expect(scanNearestAvailableRanges(merged, "2026-06-10", "2026-06-12", 3)).toEqual([]);
  });

  it("next start skips a block; nearest prefers smallest |Δdays| to requested start (may be before the block)", () => {
    const merged = mergeBookingYmd([{ startYmd: "2026-06-10", endYmd: "2026-06-15" }]);
    const next = scanNextAvailableStart(merged, "2026-06-10", "2026-06-13");
    expect(next).toBe("2026-06-16");
    const near = scanNearestAvailableRanges(merged, "2026-06-10", "2026-06-13", 3);
    expect(near.length).toBeGreaterThan(0);
    expect(near[0].startDate).toBe("2026-06-06");
  });

  it("same-day turnover: guest A ends 15th, guest B can start 15th if no overlap on inclusive [s,e]", () => {
    const merged = mergeBookingYmd([{ startYmd: "2026-06-10", endYmd: "2026-06-14" }]);
    const next = scanNextAvailableStart(merged, "2026-06-10", "2026-06-10");
    expect(next).toBe("2026-06-15");
  });
});
