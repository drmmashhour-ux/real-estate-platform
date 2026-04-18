import { describe, expect, it } from "vitest";
import { simulateGrowthScenario } from "../growth-simulation-engine.service";
import type { GrowthSimulationBaseline, GrowthSimulationScenarioInput } from "../growth-simulation.types";

const base = (over: Partial<GrowthSimulationBaseline> = {}): GrowthSimulationBaseline => ({
  leadsTotal: 50,
  hotLeads: 2,
  dueNow: 1,
  leadsTodayEarly: 3,
  adsPerformance: "OK",
  missingDataWarnings: [],
  ...over,
});

describe("simulateGrowthScenario", () => {
  it("bounds delta magnitudes", () => {
    const s: GrowthSimulationScenarioInput = {
      id: "x",
      type: "fix_conversion",
      title: "t",
      assumptions: [],
    };
    const out = simulateGrowthScenario(s, base({ adsPerformance: "WEAK" }));
    for (const e of out.estimates) {
      expect(Math.abs(e.estimatedDeltaPct ?? 0)).toBeLessThanOrEqual(22);
    }
  });

  it("reduces acquisition upside when conversion weak", () => {
    const acq: GrowthSimulationScenarioInput = {
      id: "a",
      type: "increase_acquisition",
      title: "a",
      assumptions: [],
    };
    const weak = simulateGrowthScenario(acq, base({ adsPerformance: "WEAK" }));
    const ok = simulateGrowthScenario(acq, base({ adsPerformance: "OK" }));
    const leadWeak = weak.estimates.find((e) => e.metric === "leads")?.estimatedDeltaPct ?? 0;
    const leadOk = ok.estimates.find((e) => e.metric === "leads")?.estimatedDeltaPct ?? 0;
    expect(leadWeak).toBeLessThanOrEqual(leadOk);
  });
});
