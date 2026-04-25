import { describe, expect, it } from "vitest";
import { estimateQuebecEsgIncentives } from "../quebec-esg-incentive.service";
import type { QuebecEsgRecommendation } from "../quebec-esg-recommendation.service";
import type { GreenEngineInput } from "@/modules/green/green.types";

function rec(key: string): QuebecEsgRecommendation {
  return {
    key,
    title: key,
    description: "",
    estimatedScoreLift: 10,
    priority: "medium",
    effort: "medium",
    rationale: [],
    relatedFactor: "windows",
  };
}

describe("estimateQuebecEsgIncentives", () => {
  it("excludes closed programs outside history mode", () => {
    const input: GreenEngineInput = {};
    const out = estimateQuebecEsgIncentives([rec("replace_heating_heat_pump")], input, { historyMode: false });
    const closed = out.incentives.filter((i) => i.programKey === "chauffez_vert_oil_propane_closed");
    expect(closed.length).toBe(0);
  });

  it("can include closed programs in history mode", () => {
    const input: GreenEngineInput = {};
    const out = estimateQuebecEsgIncentives([rec("replace_heating_heat_pump")], input, { historyMode: true });
    const closed = out.incentives.filter((i) => i.programKey === "chauffez_vert_oil_propane_closed");
    expect(closed.length).toBeGreaterThanOrEqual(1);
    expect(closed[0]?.status).toBe("closed");
  });

  it("does not overstate totals when amounts are informational", () => {
    const input: GreenEngineInput = { surfaceSqft: 1200 };
    const out = estimateQuebecEsgIncentives([rec("install_triple_glazed_windows")], input);
    expect(out.incentives.some((i) => i.title.includes("Rénoclimat"))).toBe(true);
  });

  it("returns null total when heat-pump stack is only informational programs", () => {
    const input: GreenEngineInput = {};
    const out = estimateQuebecEsgIncentives([rec("replace_heating_heat_pump")], input, { historyMode: false });
    expect(out.incentives.length).toBeGreaterThan(0);
    expect(out.incentives.every((i) => i.status !== "closed")).toBe(true);
    expect(out.totalEstimatedIncentives).toBeNull();
  });
});
