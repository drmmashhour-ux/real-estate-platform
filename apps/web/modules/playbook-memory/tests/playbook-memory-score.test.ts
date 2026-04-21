import { describe, expect, it } from "vitest";
import {
  aggregateNumericScore,
  hybridCandidateScore,
  numericScoreToBand,
} from "../utils/playbook-memory-score";

describe("playbook-memory-score", () => {
  it("hybridCandidateScore stays in [0,1]", () => {
    const s = hybridCandidateScore({
      similarityScore: 0.9,
      playbookPerformanceScore: 0.8,
      contextMatchScore: 0.7,
      recencyScore: 0.6,
      confidenceScore: 0.5,
    });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it("numericScoreToBand tiers", () => {
    expect(numericScoreToBand(0.9)).toBe("ELITE");
    expect(numericScoreToBand(0.7)).toBe("HIGH");
    expect(numericScoreToBand(0.45)).toBe("MEDIUM");
    expect(numericScoreToBand(0.1)).toBe("LOW");
  });

  it("aggregateNumericScore reacts to success rate", () => {
    const low = aggregateNumericScore({
      totalExecutions: 40,
      successfulExecutions: 10,
      avgConversionLift: 0.1,
      avgRealizedRevenue: 1000,
      avgRiskScore: 0.2,
    });
    const high = aggregateNumericScore({
      totalExecutions: 40,
      successfulExecutions: 35,
      avgConversionLift: 0.4,
      avgRealizedRevenue: 50000,
      avgRiskScore: 0.1,
    });
    expect(high).toBeGreaterThan(low);
  });
});
