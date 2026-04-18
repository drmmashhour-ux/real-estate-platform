import { describe, expect, it } from "vitest";
import { buildGrowthMemoryMissionNotes } from "../growth-memory-mission-control-bridge.service";
import type { GrowthMemorySummary } from "../growth-memory.types";

describe("buildGrowthMemoryMissionNotes", () => {
  it("returns compact operator-facing lines", () => {
    const m: GrowthMemorySummary = {
      recurringBlockers: [{ id: "1", category: "blocker", title: "Follow-up lag", detail: "", source: "executive", confidence: 0.5, createdAt: "x" }],
      winningPatterns: [{ id: "2", category: "winning_pattern", title: "Campaign A wins", detail: "", source: "executive", confidence: 0.4, createdAt: "x" }],
      campaignLessons: [],
      followupLessons: [],
      governanceLessons: [
        {
          id: "3",
          category: "governance_lesson",
          title: "Freeze when signals conflict",
          detail: "",
          source: "governance",
          confidence: 0.6,
          createdAt: "x",
        },
      ],
      operatorPreferences: [],
      notes: [],
      createdAt: "x",
    };
    const lines = buildGrowthMemoryMissionNotes(m);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines.some((l) => l.includes("recurring blocker"))).toBe(true);
  });
});
