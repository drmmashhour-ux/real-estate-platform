import { describe, expect, it, vi, afterEach } from "vitest";
import type { GrowthSimulationBaseline } from "../growth-simulation.types";
import { assembleGrowthSimulationBundle } from "../growth-simulation.service";

const baseline = (): GrowthSimulationBaseline => ({
  leadsTotal: 10,
  hotLeads: 1,
  dueNow: 1,
  leadsTodayEarly: 2,
  adsPerformance: "OK",
  executiveStatus: "healthy",
  missingDataWarnings: [],
});

describe("assembleGrowthSimulationBundle", () => {
  it("does not mutate baseline or scenario inputs", () => {
    const b = baseline();
    const scenarios = [{ id: "x", type: "mixed_strategy" as const, title: "t", assumptions: ["a"] }];
    const bSnap = JSON.stringify(b);
    const sSnap = JSON.stringify(scenarios);
    const bundle = assembleGrowthSimulationBundle(b, scenarios);
    expect(JSON.stringify(b)).toBe(bSnap);
    expect(JSON.stringify(scenarios)).toBe(sSnap);
    expect(bundle.scenarios).toHaveLength(1);
    expect(bundle.baselineSummary.leads).toBe(10);
  });

  it("produces bounded estimates for each scenario", () => {
    const b = baseline();
    const scenarios = [
      { id: "a", type: "increase_acquisition" as const, title: "A", assumptions: [] },
      { id: "b", type: "fix_conversion" as const, title: "B", assumptions: [] },
    ];
    const bundle = assembleGrowthSimulationBundle(b, scenarios);
    for (const r of bundle.scenarios) {
      for (const e of r.estimates) {
        expect(Math.abs(e.estimatedDeltaPct ?? 0)).toBeLessThanOrEqual(22);
      }
    }
  });
});

describe("buildGrowthSimulationBundle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when simulation flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_SIMULATION_V1", "");
    vi.resetModules();
    const { buildGrowthSimulationBundle } = await import("../growth-simulation.service");
    await expect(buildGrowthSimulationBundle()).resolves.toBeNull();
  });
});
