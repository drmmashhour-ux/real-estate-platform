import { describe, expect, it, vi, afterEach } from "vitest";

describe("buildGrowthSimulationScenarios", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns empty when scenarios flag off", async () => {
    vi.stubEnv("FEATURE_GROWTH_SIMULATION_SCENARIOS_V1", "");
    vi.resetModules();
    const { buildGrowthSimulationScenarios } = await import("../growth-simulation-scenarios.service");
    expect(buildGrowthSimulationScenarios()).toEqual([]);
  });

  it("returns five scenarios when flag on", async () => {
    vi.stubEnv("FEATURE_GROWTH_SIMULATION_SCENARIOS_V1", "1");
    vi.resetModules();
    const { buildGrowthSimulationScenarios } = await import("../growth-simulation-scenarios.service");
    const s = buildGrowthSimulationScenarios();
    expect(s.length).toBe(5);
    expect(s[0]?.type).toBe("increase_acquisition");
  });
});
