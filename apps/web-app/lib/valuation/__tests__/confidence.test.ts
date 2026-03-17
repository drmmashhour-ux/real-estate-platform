import { describe, it, expect } from "vitest";
import { computeConfidenceScore, getDataConfidenceNote } from "../confidence";

describe("computeConfidenceScore", () => {
  it("returns high when comparables and completeness are strong", () => {
    const { score, label } = computeConfidenceScore({
      comparableCount: 8,
      dataCompleteness: 1,
      signalConsistency: 1,
      dataFreshnessDays: 3,
    });
    expect(score).toBeGreaterThanOrEqual(75);
    expect(label).toBe("high");
  });

  it("returns lower score when data is scarce", () => {
    const { score, label } = computeConfidenceScore({
      comparableCount: 0,
      dataCompleteness: 0.2,
      signalConsistency: 0.3,
    });
    expect(score).toBeLessThan(75);
    expect(["low", "medium", "high"]).toContain(label);
  });

  it("returns score between 0 and 100", () => {
    const { score } = computeConfidenceScore({
      comparableCount: 5,
      dataCompleteness: 0.5,
      signalConsistency: 0.5,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("getDataConfidenceNote", () => {
  it("returns a string for each label", () => {
    expect(getDataConfidenceNote("high")).toBeTruthy();
    expect(getDataConfidenceNote("medium")).toBeTruthy();
    expect(getDataConfidenceNote("low")).toContain("uncertainty");
  });
});
