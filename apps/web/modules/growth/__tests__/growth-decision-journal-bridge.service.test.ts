import { describe, expect, it } from "vitest";
import { buildGrowthDecisionJournalInsights } from "../growth-decision-journal-bridge.service";
import type { GrowthDecisionJournalSummary } from "../growth-decision-journal.types";

describe("buildGrowthDecisionJournalInsights", () => {
  it("returns bounded advisory strings", () => {
    const summary: GrowthDecisionJournalSummary = {
      entries: [],
      reflections: [],
      stats: {
        recommendedCount: 0,
        approvedCount: 2,
        rejectedCount: 1,
        executedCount: 0,
        deferredCount: 3,
        reviewRequiredCount: 4,
        positiveOutcomeCount: 1,
        negativeOutcomeCount: 1,
        neutralOutcomeCount: 1,
      },
      createdAt: "x",
    };
    const lines = buildGrowthDecisionJournalInsights(summary);
    expect(lines.length).toBeLessThanOrEqual(6);
  });
});
