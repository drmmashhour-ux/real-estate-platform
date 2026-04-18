import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthGovernancePolicyMonitoringSnapshot,
  recordGrowthGovernancePolicyBuild,
  resetGrowthGovernancePolicyMonitoringForTests,
} from "../growth-governance-policy-monitoring.service";

beforeEach(() => {
  resetGrowthGovernancePolicyMonitoringForTests();
});

describe("growth-governance-policy-monitoring", () => {
  it("updates counters", () => {
    recordGrowthGovernancePolicyBuild({
      blockedCount: 1,
      frozenCount: 1,
      reviewCount: 3,
      advisoryOnlyCount: 4,
      notesCount: 2,
      missingDataWarningCount: 1,
    });
    const s = getGrowthGovernancePolicyMonitoringSnapshot();
    expect(s.policyBuilds).toBe(1);
    expect(s.blockedDomainCount).toBe(1);
    expect(s.missingDataWarnings).toBe(1);
  });
});
