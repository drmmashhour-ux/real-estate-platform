import { describe, expect, it } from "vitest";
import {
  getGrowthPolicyMonitoringSnapshot,
  recordGrowthPolicyEvaluation,
  resetGrowthPolicyMonitoringForTests,
} from "../growth-policy-monitoring.service";

describe("growth-policy-monitoring", () => {
  it("tracks severity counts and domains", () => {
    resetGrowthPolicyMonitoringForTests();
    recordGrowthPolicyEvaluation([
      {
        id: "a",
        domain: "ads",
        severity: "warning",
        title: "T",
        description: "D",
        recommendation: "R",
      },
      {
        id: "b",
        domain: "governance",
        severity: "critical",
        title: "T2",
        description: "D2",
        recommendation: "R2",
      },
      {
        id: "c",
        domain: "content",
        severity: "info",
        title: "T3",
        description: "D3",
        recommendation: "R3",
      },
    ]);
    const snap = getGrowthPolicyMonitoringSnapshot();
    expect(snap.evaluationsCount).toBe(1);
    expect(snap.warningsCount).toBe(1);
    expect(snap.criticalCount).toBe(1);
    expect(snap.infoCount).toBe(1);
    expect(snap.domainsTriggered.ads).toBe(1);
    expect(snap.domainsTriggered.governance).toBe(1);
    expect(snap.domainsTriggered.content).toBe(1);
  });

  it("reset clears state", () => {
    resetGrowthPolicyMonitoringForTests();
    expect(getGrowthPolicyMonitoringSnapshot().evaluationsCount).toBe(0);
  });
});
