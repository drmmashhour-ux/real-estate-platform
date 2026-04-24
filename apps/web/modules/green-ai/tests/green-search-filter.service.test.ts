import { describe, expect, it } from "vitest";
import { applyGreenSearchFilters } from "../green-search-filter.service";
import type { GreenSearchResultDecoration } from "../green-search.types";

const baseDec = (o: Partial<GreenSearchResultDecoration>): GreenSearchResultDecoration => ({
  currentScore: null,
  projectedScore: null,
  scoreDelta: null,
  label: null,
  quebecLabel: null,
  improvementPotential: null,
  hasPotentialIncentives: false,
  estimatedIncentives: null,
  rankingBoostSuggestion: 1,
  brokerCallouts: [],
  disclaimers: [],
  rationale: [],
  efficientHeating: null,
  highInsulation: null,
  highWindowPerformance: null,
  hasSolar: null,
  hasGreenRoof: null,
  usedSnapshot: false,
  computedOnTheFly: false,
  ...o,
});

describe("applyGreenSearchFilters", () => {
  it("passes all when no filters", () => {
    const items = [{ id: "a" }, { id: "b" }];
    const m = new Map([["a", baseDec({ label: "LOW" })], ["b", null]]);
    expect(applyGreenSearchFilters(items, undefined, m)).toHaveLength(2);
  });

  it("excludes when label missing and minimumGreenLabel set", () => {
    const m = new Map([["a", baseDec({ label: null, currentScore: 50 })]]);
    const out = applyGreenSearchFilters([{ id: "a" }], { minimumGreenLabel: "GREEN" }, m);
    expect(out).toHaveLength(0);
  });

  it("matches GREEN label", () => {
    const m = new Map([["a", baseDec({ label: "GREEN", currentScore: 80 })]]);
    const out = applyGreenSearchFilters([{ id: "a" }], { minimumGreenLabel: "IMPROVABLE" }, m);
    expect(out).toHaveLength(1);
  });
});
