import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthMemoryMonitoringSnapshot,
  recordGrowthMemoryBuild,
  resetGrowthMemoryMonitoringForTests,
} from "../growth-memory-monitoring.service";

beforeEach(() => {
  resetGrowthMemoryMonitoringForTests();
});

describe("growth-memory-monitoring", () => {
  it("updates counters", () => {
    recordGrowthMemoryBuild({
      entriesExtracted: 10,
      recurringBlockers: 2,
      winningPatterns: 1,
      lessonsCount: 4,
      missingDataWarningCount: 1,
    });
    const s = getGrowthMemoryMonitoringSnapshot();
    expect(s.memoryBuilds).toBe(1);
    expect(s.entriesExtracted).toBe(10);
    expect(s.recurringBlockersCount).toBe(2);
    expect(s.winningPatternsCount).toBe(1);
    expect(s.lessonsCount).toBe(4);
    expect(s.missingDataWarnings).toBe(1);
  });
});
