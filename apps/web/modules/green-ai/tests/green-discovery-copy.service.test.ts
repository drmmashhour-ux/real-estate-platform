import { describe, expect, it } from "vitest";
import { getGreenOpportunityBucket, greenDiscoveryLine, lineUpgradesNudge, GREEN_COPY } from "../green-discovery-copy.service";
import type { GreenSearchResultDecoration } from "../green-search.types";

const full = (o: Partial<GreenSearchResultDecoration>): GreenSearchResultDecoration => ({
  currentScore: 75,
  projectedScore: 82,
  scoreDelta: 7,
  label: "GREEN",
  quebecLabel: "STANDARD",
  improvementPotential: "low",
  hasPotentialIncentives: false,
  estimatedIncentives: null,
  rankingBoostSuggestion: 1.02,
  brokerCallouts: [],
  disclaimers: [],
  rationale: [],
  efficientHeating: null,
  highInsulation: null,
  highWindowPerformance: null,
  hasSolar: null,
  hasGreenRoof: null,
  usedSnapshot: true,
  computedOnTheFly: false,
  ...o,
});

describe("greenDiscoveryLine", () => {
  it("GREEN_COPY disclaims Rénoclimat and official labels (negative, not a claim)", () => {
    expect(GREEN_COPY.disclaimerShort).toMatch(/Rénoclimat|not.*government|government label/i);
    expect(GREEN_COPY.disclaimerShort).toMatch(/Québec|model/i);
  });

  it("emits high-score line without guarantee phrases", () => {
    const line = greenDiscoveryLine(full({ currentScore: 80 }), "card");
    expect(line).toMatch(/Québec|modeled/);
    expect(line).not.toMatch(/guarantee|Rénoclimat|grant/i);
  });
});

describe("getGreenOpportunityBucket", () => {
  it("returns unknown for null", () => {
    expect(getGreenOpportunityBucket(null)).toBe("unknown");
  });

  it("returns top_current for strong current score", () => {
    expect(getGreenOpportunityBucket(full({ currentScore: 80 }))).toBe("top_current");
  });
});

describe("lineUpgradesNudge", () => {
  it("nudges when snapshot missing", () => {
    const t = lineUpgradesNudge(null);
    expect(t.length).toBeGreaterThan(5);
  });
});
