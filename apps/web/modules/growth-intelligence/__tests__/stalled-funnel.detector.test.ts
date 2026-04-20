import { describe, expect, it } from "vitest";
import { detectStalledFunnel } from "../detectors/stalled-funnel.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("stalled-funnel.detector", () => {
  it("fires when stalled workflow heuristic exceeds threshold", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: {},
        eventCountsPrev30d: {},
        documentRejectCounts30d: {},
        stalledWorkflowCount: 5,
        availabilityNotes: [],
      },
    });
    const sigs = detectStalledFunnel(snap);
    expect(sigs.length).toBe(1);
    expect(sigs[0]?.signalType).toBe("stalled_funnel");
    expect(sigs[0]?.metadata.timelineDerived).toBe(true);
  });

  it("does not fire below threshold", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: {},
        eventCountsPrev30d: {},
        documentRejectCounts30d: {},
        stalledWorkflowCount: 1,
        availabilityNotes: [],
      },
    });
    expect(detectStalledFunnel(snap)).toHaveLength(0);
  });
});
