import { describe, expect, it } from "vitest";
import { buildGrowthMissionReviewQueue } from "../growth-mission-control-review.service";
import type { GrowthMissionControlBuildContext } from "../growth-mission-control.types";

describe("buildGrowthMissionReviewQueue", () => {
  it("includes governance queue items", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: null,
      governance: {
        status: "human_review_required",
        topRisks: [],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [
          {
            id: "hr1",
            title: "Review ads spike",
            reason: "Anomaly",
            category: "ads",
            severity: "high",
          },
        ],
        notes: [],
        createdAt: "x",
      },
      fusion: null,
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    const { items: q } = buildGrowthMissionReviewQueue(ctx);
    expect(q.some((i) => i.id === "hr1")).toBe(true);
  });

  it("includes high-impact manual-only fusion actions", () => {
    const ctx: GrowthMissionControlBuildContext = {
      executive: null,
      dailyBrief: null,
      governance: {
        status: "healthy",
        topRisks: [],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: "x",
      },
      fusion: {
        summary: {
          status: "moderate",
          topProblems: [],
          topOpportunities: [],
          topActions: [],
          confidence: 0.5,
          signals: [],
          grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
          createdAt: "x",
        },
        actions: [
          {
            id: "manual-fus",
            title: "Review blocked autopilot actions",
            description: "",
            source: "autopilot",
            impact: "high",
            confidence: 0.7,
            priorityScore: 88,
            why: "Requires human approval per policy.",
            executionMode: "manual_only",
          },
        ],
      },
      strategyBundle: null,
      coordination: null,
      simulationBundle: null,
      learningControl: null,
      responseDesk: null,
      autopilotFocusTitle: null,
      missingDataWarnings: [],
    };
    const { items: q } = buildGrowthMissionReviewQueue(ctx);
    expect(q.some((i) => i.id === "fusion-manual-fus")).toBe(true);
  });
});
