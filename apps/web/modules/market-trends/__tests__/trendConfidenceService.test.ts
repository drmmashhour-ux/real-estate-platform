import { describe, expect, it } from "vitest";
import { confidenceFromSampleSize } from "../infrastructure/trendConfidenceService";

describe("confidenceFromSampleSize", () => {
  it("returns insufficient_data for weak samples", () => {
    expect(confidenceFromSampleSize(2, 90)).toBe("insufficient_data");
  });

  it("ramps confidence with listing count (90d window)", () => {
    expect(confidenceFromSampleSize(5, 90)).toBe("low");
    const mid = confidenceFromSampleSize(30, 90);
    expect(["low", "medium", "high"]).toContain(mid);
  });
});
