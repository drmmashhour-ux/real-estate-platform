import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthCadenceMonitoringSnapshot,
  recordGrowthCadenceBuild,
  resetGrowthCadenceMonitoringForTests,
} from "../growth-cadence-monitoring.service";

beforeEach(() => {
  resetGrowthCadenceMonitoringForTests();
});

describe("growth-cadence-monitoring", () => {
  it("updates counters", () => {
    recordGrowthCadenceBuild({
      status: "watch",
      focus: "x",
      checklistCount: 4,
      riskCount: 2,
      missingDataWarningCount: 1,
    });
    const s = getGrowthCadenceMonitoringSnapshot();
    expect(s.cadenceBuilds).toBe(1);
    expect(s.watchCount).toBe(1);
    expect(s.checklistItemsGenerated).toBe(4);
    expect(s.risksDetected).toBe(2);
    expect(s.missingDataWarnings).toBe(1);
  });
});
