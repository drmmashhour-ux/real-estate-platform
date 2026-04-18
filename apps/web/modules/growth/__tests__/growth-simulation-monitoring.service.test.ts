import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthSimulationMonitoringSnapshot,
  recordGrowthSimulationBuild,
  resetGrowthSimulationMonitoringForTests,
} from "../growth-simulation-monitoring.service";

beforeEach(() => {
  resetGrowthSimulationMonitoringForTests();
});

describe("growth-simulation-monitoring", () => {
  it("updates counters and never throws", () => {
    recordGrowthSimulationBuild({
      baselineStatus: "healthy",
      scenarioCount: 3,
      topRecommendation: "caution",
      missingDataWarningCount: 1,
      lowConfidenceScenarioCount: 2,
      consider: 0,
      caution: 2,
      defer: 1,
    });
    const s = getGrowthSimulationMonitoringSnapshot();
    expect(s.simulationBuilds).toBe(1);
    expect(s.scenariosGenerated).toBe(3);
    expect(s.considerCount).toBe(0);
    expect(s.cautionCount).toBe(2);
    expect(s.deferCount).toBe(1);
    expect(s.lowConfidenceCount).toBe(2);
    expect(s.missingDataWarnings).toBe(1);
  });
});
