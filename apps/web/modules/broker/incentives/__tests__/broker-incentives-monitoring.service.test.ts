import { describe, expect, it } from "vitest";

import {
  getBrokerIncentivesMonitoringSnapshot,
  recordIncentiveSummaryBuilt,
  resetBrokerIncentivesMonitoringForTests,
} from "@/modules/broker/incentives/broker-incentives-monitoring.service";

describe("broker-incentives-monitoring", () => {
  it("aggregates counters", () => {
    resetBrokerIncentivesMonitoringForTests();
    recordIncentiveSummaryBuilt({ badgeCount: 2, streakCount: 3, milestoneAchieved: 4 });
    const s = getBrokerIncentivesMonitoringSnapshot();
    expect(s.summariesBuilt).toBe(1);
    expect(s.badgesUnlocked).toBe(2);
    expect(s.streaksUpdated).toBe(3);
    expect(s.milestonesAchieved).toBe(4);
  });
});
