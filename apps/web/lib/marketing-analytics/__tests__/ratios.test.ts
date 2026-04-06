import { describe, it, expect } from "vitest";
import { ratioToPercent, safeRatio } from "../ratios";
import { performanceScore } from "../aggregate-metrics";

describe("safeRatio", () => {
  it("returns null for zero denominator", () => {
    expect(safeRatio(1, 0)).toBeNull();
  });
  it("divides safely", () => {
    expect(safeRatio(3, 100)).toBe(0.03);
  });
});

describe("ratioToPercent", () => {
  it("converts to percent", () => {
    expect(ratioToPercent(0.1234, 2)).toBe(12.34);
  });
  it("handles null", () => {
    expect(ratioToPercent(null)).toBeNull();
  });
});

describe("performanceScore", () => {
  it("weights conversions highest", () => {
    const a = performanceScore({ totalViews: 1000, totalClicks: 100, totalConversions: 0 });
    const b = performanceScore({ totalViews: 10, totalClicks: 1, totalConversions: 2 });
    expect(b).toBeGreaterThan(a);
  });
});
