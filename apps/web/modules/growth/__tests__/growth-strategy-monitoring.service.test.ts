import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getGrowthStrategyMonitoringSnapshot,
  recordGrowthStrategyBuild,
  resetGrowthStrategyMonitoringForTests,
} from "../growth-strategy-monitoring.service";

beforeEach(() => {
  resetGrowthStrategyMonitoringForTests();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("growth-strategy-monitoring", () => {
  it("increments counters and never throws", () => {
    recordGrowthStrategyBuild({
      status: "healthy",
      topPriority: "x",
      priorityCount: 3,
      experimentCount: 2,
      roadmapCount: 4,
      missingDataWarningCount: 1,
    });
    const s = getGrowthStrategyMonitoringSnapshot();
    expect(s.strategyBuilds).toBe(1);
    expect(s.prioritiesGenerated).toBe(3);
    expect(s.experimentsGenerated).toBe(2);
    expect(s.roadmapItemsGenerated).toBe(4);
    expect(s.missingDataWarnings).toBe(1);
    expect(s.healthyCount).toBe(1);
  });

  it("reset clears state", () => {
    recordGrowthStrategyBuild({
      status: "weak",
      priorityCount: 1,
      experimentCount: 0,
      roadmapCount: 0,
      missingDataWarningCount: 0,
    });
    resetGrowthStrategyMonitoringForTests();
    expect(getGrowthStrategyMonitoringSnapshot().strategyBuilds).toBe(0);
  });
});
