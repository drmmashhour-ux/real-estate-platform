import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthExecutiveMonitoringCounters,
  recordGrowthExecutiveBuild,
  resetGrowthExecutiveMonitoringForTests,
} from "../growth-executive-monitoring.service";

beforeEach(() => {
  resetGrowthExecutiveMonitoringForTests();
});

describe("growth-executive-monitoring", () => {
  it("increments builds and status bucket", () => {
    recordGrowthExecutiveBuild({
      status: "healthy",
      topPriority: "Test",
      priorityCount: 3,
      missingDataNotes: ["a"],
    });
    const c = getGrowthExecutiveMonitoringCounters();
    expect(c.executiveBuilds).toBe(1);
    expect(c.healthyCount).toBe(1);
    expect(c.missingDataWarnings).toBe(1);
  });

  it("never throws on bad input shape", () => {
    expect(() =>
      recordGrowthExecutiveBuild({
        status: "watch",
        priorityCount: 0,
        missingDataNotes: [],
      }),
    ).not.toThrow();
  });
});
