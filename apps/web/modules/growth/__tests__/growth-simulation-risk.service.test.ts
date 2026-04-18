import { describe, expect, it } from "vitest";
import { evaluateGrowthSimulationRisks } from "../growth-simulation-risk.service";
import type { GrowthSimulationBaseline, GrowthSimulationScenarioInput } from "../growth-simulation.types";

describe("evaluateGrowthSimulationRisks", () => {
  it("flags acquisition + weak conversion", () => {
    const scenario: GrowthSimulationScenarioInput = {
      id: "1",
      type: "increase_acquisition",
      title: "t",
      assumptions: [],
    };
    const baseline: GrowthSimulationBaseline = {
      leadsTotal: 10,
      hotLeads: 0,
      dueNow: 0,
      leadsTodayEarly: 0,
      adsPerformance: "WEAK",
      missingDataWarnings: [],
    };
    const risks = evaluateGrowthSimulationRisks(scenario, baseline);
    expect(risks.some((r) => r.severity === "high")).toBe(true);
  });
});
