import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthMissionControlMonitoringSnapshot,
  recordGrowthMissionControlBuild,
  recordMissionControlActionsBuilt,
  recordMissionControlActionClick,
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
    expect(s.actionBundlesGenerated).toBe(0);
    expect(s.missionActionClicks).toBe(0);
  });

  it("tracks action bridge metrics", () => {
    recordMissionControlActionsBuilt({
      candidateCount: 4,
      rankedCount: 3,
      topGenerated: true,
      listCount: 2,
    });
    recordMissionControlActionClick({ navTarget: "fusion", actionId: "a1", role: "top" });
    recordMissionControlActionClick({ navTarget: "fusion", actionId: "a2", role: "list" });
    const s = getGrowthMissionControlMonitoringSnapshot();
    expect(s.actionBundlesGenerated).toBe(1);
    expect(s.actionsGeneratedTotal).toBe(3);
    expect(s.topActionsGenerated).toBe(1);
    expect(s.missionActionClicks).toBe(2);
    expect(s.missionActionNavByTarget.fusion).toBe(2);
  });
});
