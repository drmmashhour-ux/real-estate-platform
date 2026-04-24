import { describe, expect, it } from "vitest";
import { rankListingsWithGreenSignals } from "../green-ranking.service";
import type { GreenSearchResultDecoration } from "../green-search.types";

const d = (o: Partial<GreenSearchResultDecoration>): GreenSearchResultDecoration => ({
  currentScore: 50,
  projectedScore: 70,
  scoreDelta: 20,
  label: "IMPROVABLE",
  quebecLabel: "STANDARD",
  improvementPotential: "high",
  hasPotentialIncentives: true,
  estimatedIncentives: 5000,
  rankingBoostSuggestion: 1.04,
  brokerCallouts: [],
  disclaimers: [],
  rationale: ["r1"],
  efficientHeating: true,
  highInsulation: true,
  highWindowPerformance: true,
  hasSolar: false,
  hasGreenRoof: false,
  usedSnapshot: true,
  computedOnTheFly: false,
  ...o,
});

describe("rankListingsWithGreenSignals", () => {
  it("orders by green_best_now (higher current first)", () => {
    const dec = new Map<string, GreenSearchResultDecoration | null>([
      ["a", d({ currentScore: 40 })],
      ["b", d({ currentScore: 80 })],
    ]);
    const { ranked } = rankListingsWithGreenSignals({
      items: [{ id: "a" }, { id: "b" }],
      decorationById: dec,
      getId: (x) => (x as { id: string }).id,
      sortMode: "green_best_now",
      audience: "public",
    });
    expect((ranked[0] as { id: string }).id).toBe("b");
  });
});
