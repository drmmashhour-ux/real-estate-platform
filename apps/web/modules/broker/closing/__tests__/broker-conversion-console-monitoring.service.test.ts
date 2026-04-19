import { describe, expect, it } from "vitest";

import {
  getConversionConsoleMonitoringSnapshot,
  recordConversionConsoleOpened,
  recordConversionDraftOpened,
  recordConversionFocusLead,
  recordConversionNextActionExecuted,
  recordConversionSessionCompleted,
  recordConversionSessionStarted,
  resetConversionConsoleMonitoringForTests,
} from "@/modules/broker/closing/broker-conversion-console-monitoring.service";

describe("broker conversion console monitoring", () => {
  it("increments snapshots deterministically and resets", () => {
    resetConversionConsoleMonitoringForTests();
    recordConversionConsoleOpened();
    recordConversionFocusLead("lead-1");
    recordConversionNextActionExecuted("contacted");
    recordConversionDraftOpened();
    recordConversionSessionStarted();
    recordConversionSessionCompleted();
    const snap = getConversionConsoleMonitoringSnapshot();
    expect(snap).toEqual({
      consoleOpened: 1,
      focusLeadSelected: 1,
      nextActionExecuted: 1,
      draftsOpened: 1,
      sessionsStarted: 1,
      sessionsCompleted: 1,
    });
    resetConversionConsoleMonitoringForTests();
    expect(getConversionConsoleMonitoringSnapshot().consoleOpened).toBe(0);
  });
});
