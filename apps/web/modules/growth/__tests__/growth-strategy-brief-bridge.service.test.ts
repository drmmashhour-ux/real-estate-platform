import { describe, expect, it } from "vitest";
import { buildStrategyBriefNotes } from "../growth-strategy-brief-bridge.service";
import type { GrowthStrategyBundle } from "../growth-strategy.types";

function stubBundle(over: Partial<GrowthStrategyBundle["weeklyPlan"]> = {}): GrowthStrategyBundle {
  const createdAt = "2026-04-02T12:00:00.000Z";
  return {
    weeklyPlan: {
      horizon: "this_week",
      status: "healthy",
      topPriority: "Focus on CRM",
      priorities: [
        {
          id: "p0",
          title: "Follow up leads",
          theme: "lead_followup",
          impact: "high",
          confidence: 0.8,
          why: "test",
        },
      ],
      experiments: [{ id: "e1", title: "CTA", hypothesis: "h", successMetric: "m", scope: "small", why: "w" }],
      roadmap: [],
      blockers: ["Block A"],
      notes: [],
      createdAt,
      ...over,
    },
    roadmapSummary: [],
    createdAt,
  };
}

describe("buildStrategyBriefNotes", () => {
  it("returns short advisory strings", () => {
    const notes = buildStrategyBriefNotes(stubBundle());
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.some((n) => n.includes("anchor"))).toBe(true);
  });

  it("mentions experiments when present", () => {
    const notes = buildStrategyBriefNotes(stubBundle());
    expect(notes.some((n) => /experiment/i.test(n))).toBe(true);
  });
});
