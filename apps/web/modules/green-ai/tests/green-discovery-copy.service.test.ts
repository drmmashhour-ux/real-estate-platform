import { describe, expect, it } from "vitest";
import { greenDiscoveryLine, GREEN_COPY } from "../green-discovery-copy.service";
import type { GreenSearchResultDecoration } from "../green-search.types";

const base: GreenSearchResultDecoration = {
  currentScore: 70,
  projectedScore: 80,
  scoreDelta: 10,
  label: "GREEN",
  quebecLabel: "GREEN",
  improvementPotential: "high",
  hasPotentialIncentives: true,
  estimatedIncentives: 1000,
  rankingBoostSuggestion: 1.04,
  brokerCallouts: [],
  disclaimers: [],
  rationale: [],
  efficientHeating: true,
  highInsulation: null,
  highWindowPerformance: null,
  hasSolar: null,
  hasGreenRoof: null,
  usedSnapshot: true,
  computedOnTheFly: false,
};

describe("greenDiscoveryLine", () => {
  it("avoids government certification phrasing in helper copy", () => {
    const t = greenDiscoveryLine({ ...base, currentScore: 75 }, "search");
    expect(t.toLowerCase()).not.toContain("rénoclimat");
    expect(t.toLowerCase()).not.toContain("energuide");
  });

  it("GREEN_COPY disclaimer is short and policy-safe", () => {
    expect(GREEN_COPY.disclaimerShort).toMatch(/not/i);
  });
});
