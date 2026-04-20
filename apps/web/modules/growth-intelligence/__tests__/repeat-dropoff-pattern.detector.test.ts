import { describe, expect, it } from "vitest";
import { detectRepeatDropoffPattern } from "../detectors/repeat-dropoff-pattern.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("repeat-dropoff-pattern.detector", () => {
  it("fires when one document exceeds rejection threshold", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: {},
        eventCountsPrev30d: {},
        documentRejectCounts30d: { doc_a: 3 },
        stalledWorkflowCount: 0,
        availabilityNotes: [],
      },
    });
    const sigs = detectRepeatDropoffPattern(snap);
    expect(sigs.length).toBe(1);
    expect(sigs[0]?.signalType).toBe("repeat_dropoff_pattern");
    expect(sigs[0]?.entityId).toBe("doc_a");
  });

  it("does not fire when rejections sparse", () => {
    const snap = emptyGrowthSnapshot({
      timelineAggregation: {
        eventCounts30d: {},
        eventCountsPrev30d: {},
        documentRejectCounts30d: { doc_a: 1 },
        stalledWorkflowCount: 0,
        availabilityNotes: [],
      },
    });
    expect(detectRepeatDropoffPattern(snap)).toHaveLength(0);
  });
});
