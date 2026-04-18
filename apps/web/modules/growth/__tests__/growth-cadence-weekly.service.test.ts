import { describe, expect, it } from "vitest";
import { buildGrowthWeeklyCadence, type GrowthWeeklyCadenceInput } from "../growth-cadence-weekly.service";

describe("buildGrowthWeeklyCadence", () => {
  it("pulls priorities from strategy bundle when present", () => {
    const input: GrowthWeeklyCadenceInput = {
      strategyBundle: {
        weeklyPlan: {
          horizon: "this_week",
          status: "healthy",
          topPriority: "Scale after conversion",
          priorities: [
            {
              id: "p1",
              title: "Fix funnel",
              theme: "conversion",
              impact: "high",
              confidence: 0.8,
              why: "x",
            },
          ],
          experiments: [{ id: "e1", title: "CTA test", hypothesis: "h", successMetric: "m", scope: "small", why: "w" }],
          roadmap: [
            {
              id: "r1",
              title: "Road theme",
              horizon: "this_month",
              theme: "acquisition",
              why: "y",
              priority: "medium",
            },
          ],
          blockers: [],
          notes: [],
          createdAt: "",
        },
        roadmapSummary: [],
        createdAt: "",
      },
      executive: null,
      learningSummary: null,
      governance: null,
      learningControl: null,
    };
    const w = buildGrowthWeeklyCadence(input);
    expect(w.priorities).toContain("Fix funnel");
    expect(w.experiments).toContain("CTA test");
    expect(w.weekStart.length).toBe(10);
  });

  it("does not mutate input", () => {
    const input: GrowthWeeklyCadenceInput = {
      strategyBundle: null,
      executive: null,
      learningSummary: null,
      governance: null,
      learningControl: null,
    };
    const copy = JSON.stringify(input);
    buildGrowthWeeklyCadence(input);
    expect(JSON.stringify(input)).toBe(copy);
  });
});
