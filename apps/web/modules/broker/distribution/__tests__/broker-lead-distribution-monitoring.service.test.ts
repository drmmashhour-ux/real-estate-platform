import { describe, expect, it } from "vitest";
import {
  getBrokerLeadDistributionMonitoringSnapshot,
  recordBrokerLeadDistributionOverride,
  recordBrokerLeadDistributionDecision,
  resetBrokerLeadDistributionMonitoringForTests,
} from "../broker-lead-distribution-monitoring.service";

describe("broker-lead-distribution-monitoring", () => {
  it("aggregates and never throws from record path", () => {
    resetBrokerLeadDistributionMonitoringForTests();
    recordBrokerLeadDistributionDecision({ candidateCount: 2, sparse: true, suppressed: 1, hasAssignment: false });
    recordBrokerLeadDistributionOverride();
    const s = getBrokerLeadDistributionMonitoringSnapshot();
    expect(s.recommendationsBuilt).toBe(1);
    expect(s.sparseDataCases).toBe(1);
    expect(s.suppressedBrokerCases).toBe(1);
    expect(s.manualOverrides).toBe(1);
  });
});
