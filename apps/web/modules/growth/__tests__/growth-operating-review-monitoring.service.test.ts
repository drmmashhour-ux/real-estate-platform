import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthOperatingReviewMonitoringSnapshot,
  recordGrowthOperatingReviewBuild,
  resetGrowthOperatingReviewMonitoringForTests,
} from "../growth-operating-review-monitoring.service";

beforeEach(() => {
  resetGrowthOperatingReviewMonitoringForTests();
});

describe("growth-operating-review monitoring", () => {
  it("increments counters on record and never throws", () => {
    recordGrowthOperatingReviewBuild({
      status: "watch",
      worked: 1,
      didntWork: 2,
      blocked: 0,
      deferred: 1,
      nextWeekChanges: 3,
      missingDataWarnings: 2,
    });
    const snap = getGrowthOperatingReviewMonitoringSnapshot();
    expect(snap.reviewBuilds).toBe(1);
    expect(snap.workedCount).toBe(1);
    expect(snap.didntWorkCount).toBe(2);
    expect(snap.deferredCount).toBe(1);
    expect(snap.nextWeekChangeCount).toBe(3);
    expect(snap.missingDataWarnings).toBe(2);
    expect(snap.lastStatus).toBe("watch");
    expect(snap.lastBuildAt).toBeTruthy();
  });

  it("reset clears snapshot", () => {
    recordGrowthOperatingReviewBuild({
      status: "healthy",
      worked: 2,
      didntWork: 0,
      blocked: 0,
      deferred: 0,
      nextWeekChanges: 1,
      missingDataWarnings: 0,
    });
    resetGrowthOperatingReviewMonitoringForTests();
    const snap = getGrowthOperatingReviewMonitoringSnapshot();
    expect(snap.reviewBuilds).toBe(0);
    expect(snap.lastStatus).toBeNull();
  });
});
