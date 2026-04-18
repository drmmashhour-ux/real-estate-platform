import { describe, expect, it } from "vitest";
import { buildGrowthSimulationRecommendation } from "../growth-simulation-recommendation.service";

describe("buildGrowthSimulationRecommendation", () => {
  it("defers on low confidence and high risks", () => {
    const r = buildGrowthSimulationRecommendation({
      estimates: [{ metric: "leads", estimatedDeltaPct: 2, confidence: "low", rationale: "x" }],
      risks: [
        { severity: "high", title: "a", rationale: "r" },
        { severity: "high", title: "b", rationale: "r" },
      ],
      confidence: "low",
    });
    expect(r).toBe("defer");
  });

  it("returns caution when notable risks exist despite upside", () => {
    const r = buildGrowthSimulationRecommendation({
      estimates: [{ metric: "conversion", estimatedDeltaPct: 10, confidence: "medium", rationale: "x" }],
      risks: [{ severity: "high", title: "governance", rationale: "r" }],
      confidence: "medium",
    });
    expect(r).toBe("caution");
  });

  it("returns consider when upside is strong and risks are clear", () => {
    const r = buildGrowthSimulationRecommendation({
      estimates: [
        { metric: "conversion", estimatedDeltaPct: 12, confidence: "high", rationale: "x" },
        { metric: "leads", estimatedDeltaPct: 8, confidence: "high", rationale: "y" },
      ],
      risks: [{ severity: "low", title: "residual", rationale: "r" }],
      confidence: "high",
    });
    expect(r).toBe("consider");
  });
});
