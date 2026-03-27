import { describe, expect, it } from "vitest";
import { directionFromMedians } from "../infrastructure/marketTrendService";

describe("directionFromMedians", () => {
  it("returns insufficient_data when confidence is insufficient", () => {
    const r = directionFromMedians({
      olderMedianCents: 500_000_00,
      newerMedianCents: 520_000_00,
      olderConfidence: "insufficient_data",
      newerConfidence: "medium",
      activeListingCount: 50,
      windowDays: 90,
    });
    expect(r.direction).toBe("insufficient_data");
    expect(r.warnings.some((w) => w.includes("weak") || w.includes("low"))).toBe(true);
  });

  it("classifies upward pressure when median rises >2%", () => {
    const r = directionFromMedians({
      olderMedianCents: 500_000_00,
      newerMedianCents: 520_000_00,
      olderConfidence: "high",
      newerConfidence: "high",
      activeListingCount: 80,
      windowDays: 90,
    });
    expect(r.direction).toBe("upward_pressure");
    expect(r.safeSummary.toLowerCase()).not.toContain("guarantee");
    expect(r.safeSummary.toLowerCase()).toContain("not an appraisal");
  });

  it("classifies downward pressure when median falls >2%", () => {
    const r = directionFromMedians({
      olderMedianCents: 500_000_00,
      newerMedianCents: 480_000_00,
      olderConfidence: "high",
      newerConfidence: "high",
      activeListingCount: 80,
      windowDays: 90,
    });
    expect(r.direction).toBe("downward_pressure");
  });

  it("does not emit guaranteed-return language", () => {
    const r = directionFromMedians({
      olderMedianCents: 500_000_00,
      newerMedianCents: 510_000_00,
      olderConfidence: "high",
      newerConfidence: "high",
      activeListingCount: 80,
      windowDays: 90,
    });
    const text = `${r.safeSummary} ${r.warnings.join(" ")}`.toLowerCase();
    expect(text).not.toMatch(/guarantee|guaranteed return|sure profit/);
  });
});
