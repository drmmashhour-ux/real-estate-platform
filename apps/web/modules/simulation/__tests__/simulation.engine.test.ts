import { describe, expect, it } from "vitest";

import { runWhatIfSimulation } from "../simulation.engine";
import type { ScenarioInput, SimulationBaseline } from "../simulation.types";

const base: SimulationBaseline = {
  generatedAt: new Date().toISOString(),
  activeDeals: 10,
  pipelineValueCents: 5_000_000_00,
  leads30d: 40,
  conversionPct: 15,
  trustScore: 72,
  disputeRisk0to100: 35,
  openDisputes: 1,
  workloadUnits: 20,
  regionLabel: "Montréal",
};

const scenario: ScenarioInput = {
  leadVolumeMultiplier: 1.2,
  responseSpeedChange: -0.1,
  pricingAdjustment: 0.05,
  marketingBoost: 0.2,
  trustThresholdChange: -2,
  autopilotLevel: 1,
  regionKey: null,
};

describe("runWhatIfSimulation", () => {
  it("returns simulated-only payload with metrics and explainability", () => {
    const r = runWhatIfSimulation(base, scenario);
    expect(r.simulated).toBe(true);
    expect(r.predictedMetrics.revenueChangePct).toBeDefined();
    expect(r.riskWarnings.length).toBeGreaterThan(0);
    expect(r.recommendedActions.some((a) => a.href.includes("ai-ceo"))).toBe(true);
    expect(r.assumptions.length).toBeGreaterThan(0);
  });
});
