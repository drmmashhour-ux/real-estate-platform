import { describe, expect, it } from "vitest";
import { rankListingsWithGreenSignals } from "../green-ranking.service";
import type { GreenSearchResultDecoration } from "../green-search.types";

const dec = (o: Partial<GreenSearchResultDecoration>): GreenSearchResultDecoration => ({
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
  rationale: ["r1"],
  efficientHeating: null,
  highInsulation: null,
  highWindowPerformance: null,
  hasSolar: null,
  hasGreenRoof: null,
  usedSnapshot: false,
  computedOnTheFly: false,
  ...o,
});

describe("rankListingsWithGreenSignals", () => {
  it("orders by current score in green_best_now (public)", () => {
    const a = { id: "a", n: 1 };
    const b = { id: "b", n: 2 };
    const m = new Map<string, GreenSearchResultDecoration | null>([
      ["a", dec({ currentScore: 50 })],
      ["b", dec({ currentScore: 80 })],
    ]);
    const { ranked, signals } = rankListingsWithGreenSignals({
      items: [a, b],
      decorationById: m,
      getId: (x) => x.id,
      getBaseScore: () => 0.5,
      sortMode: "green_best_now",
      audience: "public",
    });
    expect(ranked[0]!.id).toBe("b");
    expect(signals.get("b")?.currentScore).toBe(80);
  });

  it("ranks by delta in green_upgrade_potential", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const m = new Map<string, GreenSearchResultDecoration | null>([
      ["a", dec({ currentScore: 60, scoreDelta: 5 })],
      ["b", dec({ currentScore: 50, scoreDelta: 30 })],
    ]);
    const { ranked } = rankListingsWithGreenSignals({
      items: [a, b],
      decorationById: m,
      getId: (x) => x.id,
      sortMode: "green_upgrade_potential",
      audience: "public",
    });
    expect(ranked[0]!.id).toBe("b");
  });

  it("incentive mode prefers higher illustrative totals", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const m = new Map<string, GreenSearchResultDecoration | null>([
      ["a", dec({ estimatedIncentives: 20_000, hasPotentialIncentives: true, currentScore: 50 })],
      ["b", dec({ estimatedIncentives: 1000, hasPotentialIncentives: true, currentScore: 50 })],
    ]);
    const { ranked } = rankListingsWithGreenSignals({
      items: [a, b],
      decorationById: m,
      getId: (x) => x.id,
      sortMode: "green_incentive_opportunity",
      audience: "public",
    });
    expect(ranked[0]!.id).toBe("a");
  });
});
