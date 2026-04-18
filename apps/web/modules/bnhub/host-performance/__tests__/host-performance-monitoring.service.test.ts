import { describe, expect, it, beforeEach } from "vitest";
import {
  getHostPerformanceMonitoringSnapshot,
  recordHostPerformanceSummaryBuilt,
  resetHostPerformanceMonitoringForTests,
} from "../host-performance-monitoring.service";

describe("host-performance-monitoring", () => {
  beforeEach(() => {
    resetHostPerformanceMonitoringForTests();
  });

  it("accumulates counters", () => {
    recordHostPerformanceSummaryBuilt({
      listings: 2,
      weak: 1,
      healthy: 1,
      strong: 0,
      watch: 0,
      recommendations: 3,
      missingDataWarnings: 0,
    });
    const s = getHostPerformanceMonitoringSnapshot();
    expect(s.summariesBuilt).toBe(1);
    expect(s.listingsEvaluated).toBe(2);
    expect(s.recommendationsGenerated).toBe(3);
  });

  it("reset clears snapshot", () => {
    recordHostPerformanceSummaryBuilt({
      listings: 1,
      weak: 0,
      healthy: 1,
      strong: 0,
      watch: 0,
      recommendations: 0,
      missingDataWarnings: 0,
    });
    resetHostPerformanceMonitoringForTests();
    expect(getHostPerformanceMonitoringSnapshot().summariesBuilt).toBe(0);
  });
});
