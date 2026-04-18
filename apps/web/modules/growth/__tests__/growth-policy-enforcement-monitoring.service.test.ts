import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthPolicyEnforcementMonitoringSnapshot,
  recordGrowthPolicyEnforcementBuild,
  resetGrowthPolicyEnforcementMonitoringForTests,
} from "../growth-policy-enforcement-monitoring.service";

describe("growth-policy-enforcement-monitoring.service", () => {
  beforeEach(() => {
    resetGrowthPolicyEnforcementMonitoringForTests();
  });

  it("accumulates counters and never throws", () => {
    recordGrowthPolicyEnforcementBuild({
      blockedCount: 1,
      frozenCount: 2,
      approvalCount: 0,
      advisoryOnlyCount: 3,
      notesCount: 1,
      missingDataWarningCount: 0,
      gatedTargets: ["learning_adjustments", "fusion_autopilot_bridge"],
    });
    const s = getGrowthPolicyEnforcementMonitoringSnapshot();
    expect(s.enforcementBuilds).toBe(1);
    expect(s.blockedTargetsCount).toBe(1);
    expect(s.frozenTargetsCount).toBe(2);
    expect(s.gatedUiActionsCount).toBe(2);
  });
});
