import { describe, expect, it } from "vitest";

import { computeOperationalTrust, scoreToOperationalBand } from "../trust-score.engine";
import { operationalTrustRankingModifier } from "../trust-score-ranking.service";
import { getGroupWeight, TRUST_WEIGHT_PROFILE_VERSION } from "../trust-score-weights.service";
import { parseTrustEngineTargetType } from "../trust-score-api.helpers";

describe("operational trust engine", () => {
  it("maps scores to bands deterministically", () => {
    expect(scoreToOperationalBand(90)).toBe("HIGH_TRUST");
    expect(scoreToOperationalBand(72)).toBe("GOOD");
    expect(scoreToOperationalBand(60)).toBe("WATCH");
    expect(scoreToOperationalBand(45)).toBe("ELEVATED_RISK");
    expect(scoreToOperationalBand(20)).toBe("CRITICAL_REVIEW");
  });

  it("computes weighted score from inputs", () => {
    const result = computeOperationalTrust({
      targetType: "LISTING",
      targetId: "lst_1",
      warnings: [],
      thinDataNotes: [],
      factors: [
        {
          id: "t1",
          group: "LISTING_DEAL_QUALITY",
          normalized: 1,
          rawNote: "Strong listing signal",
        },
        {
          id: "t2",
          group: "DISPUTE_FRICTION",
          normalized: -0.5,
          rawNote: "Friction signal",
        },
      ],
    });
    expect(result.trustScore).toBeGreaterThanOrEqual(0);
    expect(result.trustScore).toBeLessThanOrEqual(100);
    expect(result.weightProfileVersion).toBe(TRUST_WEIGHT_PROFILE_VERSION);
    expect(result.contributingFactors.length).toBe(2);
    expect(result.explain.topPositive.length + result.explain.topNegative.length).toBeGreaterThan(0);
  });

  it("applies per-target group weights", () => {
    const b = getGroupWeight("BROKER", "DISPUTE_FRICTION");
    const l = getGroupWeight("LISTING", "DISPUTE_FRICTION");
    expect(b).not.toEqual(l);
  });

  it("keeps ranking modifiers bounded", () => {
    const m = operationalTrustRankingModifier(30, "CRITICAL_REVIEW", true);
    expect(Math.abs(m.sortLift)).toBeLessThanOrEqual(0.06);
    expect(Math.abs(m.prominenceLift)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(m.queuePriorityLift)).toBeLessThanOrEqual(0.08);
  });

  it("parses target types", () => {
    expect(parseTrustEngineTargetType("BROKER")).toBe(true);
    expect(parseTrustEngineTargetType("INVALID")).toBe(false);
  });
});
