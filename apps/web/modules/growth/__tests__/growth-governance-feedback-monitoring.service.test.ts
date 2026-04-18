import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthGovernanceFeedbackMonitoringSnapshot,
  recordGrowthGovernanceFeedbackBuild,
  resetGrowthGovernanceFeedbackMonitoringForTests,
} from "../growth-governance-feedback-monitoring.service";

describe("growth-governance-feedback-monitoring.service", () => {
  beforeEach(() => {
    resetGrowthGovernanceFeedbackMonitoringForTests();
  });

  it("accumulates counters and never throws", () => {
    recordGrowthGovernanceFeedbackBuild({
      extractedCount: 10,
      usefulCount: 2,
      freezeCount: 3,
      blockedCount: 1,
      overconservativeCount: 1,
      reviewQueueCount: 4,
      insightCount: 2,
      missingDataWarningCount: 1,
    });
    const s = getGrowthGovernanceFeedbackMonitoringSnapshot();
    expect(s.feedbackBuilds).toBe(1);
    expect(s.entriesExtracted).toBe(10);
    expect(s.missingDataWarnings).toBe(1);
  });
});
