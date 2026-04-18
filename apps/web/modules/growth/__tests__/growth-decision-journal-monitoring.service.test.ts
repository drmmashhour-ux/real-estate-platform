import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthDecisionJournalMonitoringSnapshot,
  recordGrowthDecisionJournalBuild,
  resetGrowthDecisionJournalMonitoringForTests,
} from "../growth-decision-journal-monitoring.service";

describe("growth-decision-journal-monitoring", () => {
  beforeEach(() => {
    resetGrowthDecisionJournalMonitoringForTests();
  });

  it("updates counters", () => {
    recordGrowthDecisionJournalBuild({
      entryCount: 5,
      reflectionCount: 2,
      stats: {
        positiveOutcomeCount: 1,
        negativeOutcomeCount: 0,
        unknownOutcomeCount: 1,
      },
      missingDataWarningCount: 1,
    });
    const snap = getGrowthDecisionJournalMonitoringSnapshot();
    expect(snap.journalBuilds).toBe(1);
    expect(snap.entriesBuilt).toBe(5);
    expect(snap.reflectionsBuilt).toBe(2);
  });
});
