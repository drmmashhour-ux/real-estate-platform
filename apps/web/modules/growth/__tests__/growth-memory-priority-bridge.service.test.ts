import { describe, expect, it } from "vitest";
import { applyGrowthMemoryToPriorities } from "../growth-memory-priority-bridge.service";
import type { GrowthMemorySummary } from "../growth-memory.types";
import type { GrowthStrategyPriority } from "../growth-strategy.types";

describe("applyGrowthMemoryToPriorities", () => {
  it("annotates without removing or reordering priorities", () => {
    const priorities: GrowthStrategyPriority[] = [
      {
        id: "1",
        title: "Improve lead follow-up speed",
        theme: "lead_followup",
        impact: "high",
        confidence: 0.7,
        why: "Because",
      },
      {
        id: "2",
        title: "Unrelated item",
        theme: "content",
        impact: "low",
        confidence: 0.5,
        why: "x",
      },
    ];
    const memory: GrowthMemorySummary = {
      recurringBlockers: [
        {
          id: "m1",
          category: "blocker",
          title: "Lead follow-up delays hurt conversion",
          detail: "d",
          source: "executive",
          confidence: 0.6,
          createdAt: "x",
        },
      ],
      winningPatterns: [],
      campaignLessons: [],
      followupLessons: [],
      governanceLessons: [],
      operatorPreferences: [],
      notes: [],
      createdAt: "x",
    };
    const out = applyGrowthMemoryToPriorities({ priorities }, memory);
    expect(out.priorities).toHaveLength(2);
    expect(out.priorities[0]?.id).toBe("1");
    expect(out.priorities[0]?.memoryAnnotations?.length ?? 0).toBeGreaterThan(0);
  });

  it("does not mutate input priority objects when no match", () => {
    const priorities: GrowthStrategyPriority[] = [
      {
        id: "1",
        title: "Only content theme",
        theme: "content",
        impact: "low",
        confidence: 0.5,
        why: "x",
      },
    ];
    const memory: GrowthMemorySummary = {
      recurringBlockers: [],
      winningPatterns: [],
      campaignLessons: [],
      followupLessons: [],
      governanceLessons: [],
      operatorPreferences: [],
      notes: [],
      createdAt: "x",
    };
    const snap = JSON.stringify(priorities);
    applyGrowthMemoryToPriorities({ priorities }, memory);
    expect(JSON.stringify(priorities)).toBe(snap);
  });
});
