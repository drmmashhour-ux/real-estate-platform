import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthMissionControlMonitoringSnapshot,
  recordGrowthMissionControlBuild,
  resetGrowthMissionControlMonitoringForTests,
} from "../growth-mission-control-monitoring.service";

beforeEach(() => {
  resetGrowthMissionControlMonitoringForTests();
});

describe("growth-mission-control-monitoring", () => {
  it("updates counters", () => {
    recordGrowthMissionControlBuild({
      status: "watch",
      missionFocusTitle: "x",
      checklistCount: 4,
      riskCount: 3,
      reviewCount: 2,
      missingDataWarningCount: 1,
      dedupeEvents: 2,
      noteCount: 3,
    });
    const s = getGrowthMissionControlMonitoringSnapshot();
    expect(s.missionControlBuilds).toBe(1);
    expect(s.watchCount).toBe(1);
    expect(s.checklistItemsGenerated).toBe(4);
    expect(s.risksMerged).toBe(3);
    expect(s.reviewItemsMerged).toBe(2);
    expect(s.missingDataWarnings).toBe(1);
    expect(s.dedupeEvents).toBe(2);
  });
});
