import { describe, expect, it, beforeEach } from "vitest";
import {
  getRevenueDashboardMonitoringSnapshot,
  recordMissingDataWarning,
  recordRevenueDashboardAlertsGenerated,
  recordRevenueDashboardBuild,
  recordWeakUnlockRateDetected,
  recordZeroRevenueDayDetected,
  resetRevenueDashboardMonitoringForTests,
} from "../revenue-dashboard-monitoring.service";

describe("revenue-dashboard-monitoring.service", () => {
  beforeEach(() => {
    resetRevenueDashboardMonitoringForTests();
  });

  it("increments dashboard builds", () => {
    recordRevenueDashboardBuild();
    recordRevenueDashboardBuild();
    expect(getRevenueDashboardMonitoringSnapshot().dashboardBuilds).toBe(2);
  });

  it("tracks alerts generated count", () => {
    recordRevenueDashboardAlertsGenerated(3);
    expect(getRevenueDashboardMonitoringSnapshot().alertsGenerated).toBe(3);
  });

  it("tracks missing data, zero revenue, weak unlock counters", () => {
    recordMissingDataWarning();
    recordMissingDataWarning();
    recordZeroRevenueDayDetected();
    recordWeakUnlockRateDetected();
    const s = getRevenueDashboardMonitoringSnapshot();
    expect(s.missingDataWarnings).toBe(2);
    expect(s.zeroRevenueDaysDetected).toBe(1);
    expect(s.weakUnlockRateDetected).toBe(1);
  });

  it("reset clears all counters", () => {
    recordRevenueDashboardBuild();
    recordRevenueDashboardAlertsGenerated(1);
    recordMissingDataWarning();
    resetRevenueDashboardMonitoringForTests();
    expect(getRevenueDashboardMonitoringSnapshot()).toEqual({
      dashboardBuilds: 0,
      alertsGenerated: 0,
      missingDataWarnings: 0,
      zeroRevenueDaysDetected: 0,
      weakUnlockRateDetected: 0,
    });
  });
});
