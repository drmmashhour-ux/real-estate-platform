import { describe, expect, it } from "vitest";
import { detectSeoGap } from "../detectors/seo-gap.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("detectSeoGap", () => {
  it("fires when a city has sparse active inventory vs peer median", () => {
    const snap = emptyGrowthSnapshot({
      inventoryByRegion: [
        { regionKey: "Montréal", listingCount: 40, activePublicCount: 20 },
        { regionKey: "Laval", listingCount: 40, activePublicCount: 20 },
        { regionKey: "Smallville", listingCount: 4, activePublicCount: 1 },
      ],
    });
    expect(() => detectSeoGap(snap)).not.toThrow();
    const signals = detectSeoGap(snap);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]?.signalType).toBe("seo_gap");
    expect(signals[0]?.explanation.length).toBeGreaterThan(10);
    expect(signals.some((s) => s.region === "Smallville")).toBe(true);
  });

  it("does not fire when regions are uniformly stocked", () => {
    const snap = emptyGrowthSnapshot({
      inventoryByRegion: [
        { regionKey: "A", listingCount: 10, activePublicCount: 10 },
        { regionKey: "B", listingCount: 10, activePublicCount: 10 },
        { regionKey: "C", listingCount: 10, activePublicCount: 10 },
      ],
    });
    expect(detectSeoGap(snap)).toHaveLength(0);
  });

  it("does not throw on empty inventory", () => {
    expect(() => detectSeoGap(emptyGrowthSnapshot())).not.toThrow();
    expect(detectSeoGap(emptyGrowthSnapshot())).toHaveLength(0);
  });
});
