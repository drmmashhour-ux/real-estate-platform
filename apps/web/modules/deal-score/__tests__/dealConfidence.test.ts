import { describe, expect, it } from "vitest";
import { computeDealConfidence } from "../infrastructure/dealConfidenceService";

describe("computeDealConfidence", () => {
  it("is lower when no comparables are available", () => {
    const none = computeDealConfidence({
      comparableCount: 0,
      documentCompleteness: 0.8,
      declarationCompleteness: 0.8,
      freshnessScore: 80,
      demandReliability: 60,
    });
    const many = computeDealConfidence({
      comparableCount: 8,
      documentCompleteness: 0.8,
      declarationCompleteness: 0.8,
      freshnessScore: 80,
      demandReliability: 60,
    });
    expect(none).toBeLessThan(many);
  });
});
