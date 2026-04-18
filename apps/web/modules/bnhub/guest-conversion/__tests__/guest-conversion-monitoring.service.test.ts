import { describe, expect, it, beforeEach } from "vitest";
import {
  getGuestConversionMonitoringSnapshot,
  recordGuestConversionSummaryBuilt,
  resetGuestConversionMonitoringForTests,
} from "../guest-conversion-monitoring.service";

describe("guest-conversion-monitoring", () => {
  beforeEach(() => {
    resetGuestConversionMonitoringForTests();
  });

  it("increments counters and never throws on bad input", () => {
    recordGuestConversionSummaryBuilt({
      listingId: "listing-id-1234567890",
      status: "healthy",
      frictionCount: 2,
      recommendationCount: 3,
      warnings: 1,
    });
    const snap = getGuestConversionMonitoringSnapshot();
    expect(snap.summariesBuilt).toBe(1);
    expect(snap.healthyCount).toBe(1);
    expect(snap.frictionSignalsCount).toBe(2);
    expect(snap.recommendationsGenerated).toBe(3);
    expect(snap.missingDataWarnings).toBe(1);
  });
});
