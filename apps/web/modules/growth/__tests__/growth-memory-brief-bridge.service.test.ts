import { describe, expect, it } from "vitest";
import { buildGrowthMemoryBriefNotes } from "../growth-memory-brief-bridge.service";
import type { GrowthMemorySummary } from "../growth-memory.types";

describe("buildGrowthMemoryBriefNotes", () => {
  it("returns capped advisory lines", () => {
    const m: GrowthMemorySummary = {
      recurringBlockers: [
        {
          id: "1",
          category: "blocker",
          title: "Backlog",
          detail: "d",
          source: "executive",
          confidence: 0.5,
          createdAt: "x",
        },
      ],
      winningPatterns: [
        {
          id: "2",
          category: "winning_pattern",
          title: "Campaign X",
          detail: "d",
          source: "executive",
          confidence: 0.4,
          createdAt: "x",
        },
      ],
      campaignLessons: [],
      followupLessons: [],
      governanceLessons: [],
      operatorPreferences: [],
      notes: [],
      createdAt: "x",
    };
    const lines = buildGrowthMemoryBriefNotes(m);
    expect(lines.length).toBeLessThanOrEqual(6);
    expect(lines.some((l) => l.includes("Recurring blocker"))).toBe(true);
  });
});
