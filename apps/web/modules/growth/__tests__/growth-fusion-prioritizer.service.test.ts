import { describe, expect, it } from "vitest";
import { computeFusionActionPriorityScore, prioritizeGrowthFusionActions } from "../growth-fusion-prioritizer.service";
import type { GrowthFusionSummary } from "../growth-fusion.types";

function minimalSummary(over: Partial<GrowthFusionSummary> = {}): GrowthFusionSummary {
  const base: GrowthFusionSummary = {
    status: "moderate",
    topProblems: [],
    topOpportunities: [],
    topActions: [],
    confidence: 0.55,
    signals: [],
    grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
    createdAt: "2026-04-02T12:00:00.000Z",
  };
  return { ...base, ...over, grouped: { ...base.grouped, ...over.grouped } };
}

describe("prioritizeGrowthFusionActions", () => {
  it("sorts by priorityScore descending and caps length", () => {
    const summary = minimalSummary({
      signals: [
        {
          source: "ads",
          id: "a1",
          type: "efficiency",
          title: "Low capture",
          description: "d",
          impact: "high",
          confidence: 0.8,
          priorityScore: 40,
        },
        {
          source: "cro",
          id: "c1",
          type: "funnel",
          title: "Thin conv",
          description: "d2",
          impact: "medium",
          confidence: 0.6,
          priorityScore: 60,
        },
      ],
      topActions: ["Improve landing CTA before scaling ads"],
      topProblems: ["Conversion: view→lead efficiency is low"],
    });
    const out = prioritizeGrowthFusionActions(summary);
    expect(out.length).toBeLessThanOrEqual(8);
    const scores = out.map((x) => x.priorityScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("does not mutate input summary", () => {
    const summary = minimalSummary({
      signals: [
        {
          source: "leads",
          id: "l1",
          type: "velocity",
          title: "Stale",
          description: "d",
          impact: "low",
          confidence: 0.4,
        },
      ],
    });
    const copy = JSON.parse(JSON.stringify(summary)) as GrowthFusionSummary;
    prioritizeGrowthFusionActions(summary);
    expect(summary).toEqual(copy);
  });
});

describe("computeFusionActionPriorityScore", () => {
  it("returns 0–100", () => {
    const n = computeFusionActionPriorityScore({
      impact: "high",
      confidence: 1,
      source: "cro",
      signalPriorityScore: 80,
      revenueBlocking: true,
    });
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(100);
  });
});
