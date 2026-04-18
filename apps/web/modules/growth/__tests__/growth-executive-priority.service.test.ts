import { describe, expect, it } from "vitest";
import { buildGrowthExecutivePriorities } from "../growth-executive-priority.service";
import type { GrowthExecutivePriorityInput } from "../growth-executive.types";

function baseInput(over: Partial<GrowthExecutivePriorityInput> = {}): GrowthExecutivePriorityInput {
  const b: GrowthExecutivePriorityInput = {
    governanceDecision: null,
    fusionActions: [],
    autopilotActions: [],
    adsProblemLines: [],
    leadsToday: 2,
    hotLeadCount: 0,
    dueNowCount: 0,
    fusionTopProblems: [],
  };
  return { ...b, ...over };
}

describe("buildGrowthExecutivePriorities", () => {
  it("prefers governance human review when present", () => {
    const input = baseInput({
      governanceDecision: {
        status: "human_review_required",
        topRisks: [],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: ["Escalate pipeline"],
        humanReviewQueue: [],
        notes: [],
        createdAt: "2026-04-02T12:00:00.000Z",
      },
    });
    const out = buildGrowthExecutivePriorities(input);
    expect(out[0]?.source).toBe("governance");
    expect(out[0]?.title).toMatch(/Human review/i);
  });

  it("includes due_now leads with high rank", () => {
    const out = buildGrowthExecutivePriorities(
      baseInput({ dueNowCount: 4, hotLeadCount: 1 }),
    );
    expect(out.some((x) => x.source === "leads" && x.title.includes("due"))).toBe(true);
  });

  it("caps at 5 items", () => {
    const input = baseInput({
      governanceDecision: {
        status: "caution",
        humanReviewQueue: [],
        topRisks: [
          {
            id: "r1",
            category: "ads",
            severity: "high",
            title: "Risk1",
            description: "d",
            reason: "r",
          },
          {
            id: "r2",
            category: "cro",
            severity: "high",
            title: "Risk2",
            description: "d",
            reason: "r",
          },
        ],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        notes: [],
        createdAt: "2026-04-02T12:00:00.000Z",
      },
      autopilotActions: [
        {
          id: "a1",
          title: "A1",
          description: "",
          source: "ads",
          impact: "high",
          confidence: 0.9,
          priorityScore: 90,
          why: "w",
          signalStrength: "strong",
          executionMode: "approval_required",
          status: "pending",
          createdAt: "2026-04-02T12:00:00.000Z",
        },
      ] as GrowthExecutivePriorityInput["autopilotActions"],
      fusionActions: [
        {
          id: "f1",
          title: "F1",
          description: "",
          source: "ads",
          impact: "medium",
          confidence: 0.6,
          priorityScore: 60,
          why: "wf",
          executionMode: "approval_required",
        },
      ],
      adsProblemLines: ["weak campaign"],
    });
    expect(buildGrowthExecutivePriorities(input).length).toBeLessThanOrEqual(5);
  });

  it("does not mutate input", () => {
    const input = baseInput();
    const copy = JSON.stringify(input);
    buildGrowthExecutivePriorities(input);
    expect(JSON.stringify(input)).toBe(copy);
  });
});
