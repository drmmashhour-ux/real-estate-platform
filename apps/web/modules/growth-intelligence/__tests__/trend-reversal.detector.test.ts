import { describe, expect, it } from "vitest";
import { detectTrendReversal } from "../detectors/trend-reversal.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("trend-reversal.detector", () => {
  it("fires when positive events drop sharply vs prior window", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: { action_allowed: 2, listing_published: 1 },
        eventCountsPrev30d: { action_allowed: 14, listing_published: 6 },
        documentRejectCounts30d: {},
        stalledWorkflowCount: 0,
        availabilityNotes: [],
      },
    });
    const sigs = detectTrendReversal(snap);
    expect(sigs.length).toBe(1);
    expect(sigs[0]?.signalType).toBe("trend_reversal");
    expect(sigs[0]?.explanation.length).toBeGreaterThan(10);
    expect(sigs[0]?.metadata.timelineDerived).toBe(true);
  });

  it("does not fire when baseline too small", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: { action_allowed: 1 },
        eventCountsPrev30d: { action_allowed: 3 },
        documentRejectCounts30d: {},
        stalledWorkflowCount: 0,
        availabilityNotes: [],
      },
    });
    expect(detectTrendReversal(snap)).toHaveLength(0);
  });

  it("does not fire without timeline aggregation", () => {
    expect(detectTrendReversal(emptyGrowthSnapshot())).toHaveLength(0);
  });
});
