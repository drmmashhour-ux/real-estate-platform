import { describe, expect, it, beforeEach } from "vitest";
import {
  getPlatformImprovementMonitoringSnapshot,
  resetPlatformImprovementMonitoringForTests,
} from "../platform-improvement-monitoring.service";
import { buildFullPlatformImprovementBundle } from "../platform-improvement-review.service";

beforeEach(() => {
  resetPlatformImprovementMonitoringForTests();
});

describe("platform-improvement-monitoring", () => {
  it("increments counters when bundle builds", () => {
    buildFullPlatformImprovementBundle();
    const s = getPlatformImprovementMonitoringSnapshot();
    expect(s.reviewsBuilt).toBe(1);
    expect(s.prioritiesGenerated).toBeGreaterThan(0);
  });
});
