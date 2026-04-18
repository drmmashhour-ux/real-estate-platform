import { describe, expect, it } from "vitest";
import { buildGovernancePolicyReviewQueue } from "../growth-governance-feedback-review.service";
import type { GrowthGovernanceFeedbackSummary } from "../growth-governance-feedback.types";

describe("buildGovernancePolicyReviewQueue", () => {
  it("returns a bounded queue from summary buckets", () => {
    const summary: GrowthGovernanceFeedbackSummary = {
      repeatedUsefulConstraints: [],
      repeatedFreezePatterns: [
        {
          id: "f1",
          category: "freeze",
          target: "learning_adjustments",
          title: "freeze",
          rationale: "test",
          recurrenceCount: 3,
          source: "enforcement",
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      repeatedBlockedPatterns: [
        {
          id: "b1",
          category: "block",
          target: "autopilot",
          title: "block",
          rationale: "test",
          source: "enforcement",
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      possibleOverconservativeConstraints: [
        {
          id: "o1",
          category: "advisory_only",
          target: "strategy_simulation_promotion",
          title: "over",
          rationale: "test",
          usefulnessSignal: "too_conservative",
          source: "enforcement",
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
      notes: [],
      createdAt: "2026-04-01T00:00:00.000Z",
    };
    const q = buildGovernancePolicyReviewQueue(summary);
    expect(q.length).toBeGreaterThan(0);
    expect(q[0].recommendation.length).toBeGreaterThan(0);
  });
});
