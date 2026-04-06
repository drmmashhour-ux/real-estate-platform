import { describe, expect, it } from "vitest";
import { bnhubDateRangesOverlap } from "../checkAvailability";

describe("bnhubDateRangesOverlap", () => {
  it("detects overlap for partial intersection", () => {
    const aIn = new Date("2026-06-01T00:00:00.000Z");
    const aOut = new Date("2026-06-05T00:00:00.000Z");
    const bIn = new Date("2026-06-03T00:00:00.000Z");
    const bOut = new Date("2026-06-08T00:00:00.000Z");
    expect(bnhubDateRangesOverlap(aIn, aOut, bIn, bOut)).toBe(true);
  });

  it("returns false when ranges touch at boundary (checkout = checkin)", () => {
    const aIn = new Date("2026-06-01T00:00:00.000Z");
    const aOut = new Date("2026-06-05T00:00:00.000Z");
    const bIn = new Date("2026-06-05T00:00:00.000Z");
    const bOut = new Date("2026-06-08T00:00:00.000Z");
    expect(bnhubDateRangesOverlap(aIn, aOut, bIn, bOut)).toBe(false);
  });

  it("returns false when disjoint", () => {
    const aIn = new Date("2026-06-01T00:00:00.000Z");
    const aOut = new Date("2026-06-03T00:00:00.000Z");
    const bIn = new Date("2026-06-10T00:00:00.000Z");
    const bOut = new Date("2026-06-12T00:00:00.000Z");
    expect(bnhubDateRangesOverlap(aIn, aOut, bIn, bOut)).toBe(false);
  });
});
