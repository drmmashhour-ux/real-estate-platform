import { describe, expect, it } from "vitest";
import { estimateQuebecEsgUpgradeCosts } from "../quebec-esg-cost.service";
import type { QuebecEsgRecommendation } from "../quebec-esg-recommendation.service";
import type { GreenEngineInput } from "@/modules/green/green.types";

const baseRec = (key: string): QuebecEsgRecommendation => ({
  key,
  title: key,
  description: "",
  estimatedScoreLift: 10,
  priority: "medium",
  effort: "medium",
  rationale: [],
  relatedFactor: "heating",
});

describe("estimateQuebecEsgUpgradeCosts", () => {
  it("returns bands for window recommendation", () => {
    const input: GreenEngineInput = { surfaceSqft: 1500 };
    const r = estimateQuebecEsgUpgradeCosts([baseRec("install_triple_glazed_windows")], input);
    expect(r.costEstimates.length).toBe(1);
    expect(r.costEstimates[0]?.lowCost).toBeGreaterThan(0);
    expect(r.costEstimates[0]?.highCost).toBeGreaterThan(r.costEstimates[0]!.lowCost!);
  });

  it("widens ranges when surface missing", () => {
    const input: GreenEngineInput = {};
    const withSq = estimateQuebecEsgUpgradeCosts([baseRec("upgrade_attic_insulation")], { surfaceSqft: 2000 });
    const noSq = estimateQuebecEsgUpgradeCosts([baseRec("upgrade_attic_insulation")], input);
    expect(noSq.costEstimates[0]?.confidence).toBe("low");
    expect(noSq.costEstimates[0]?.highCost).toBeGreaterThanOrEqual(withSq.costEstimates[0]?.highCost ?? 0);
  });
});
