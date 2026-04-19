import { describe, expect, it } from "vitest";
import { buildLeadLevelRoutingSignals } from "../broker-routing-signals.service";

describe("buildLeadLevelRoutingSignals", () => {
  it("flags insufficient confidence when lead has no city, area, or type", () => {
    const { signals, sparseNotes } = buildLeadLevelRoutingSignals({
      id: "l1",
      leadType: null,
      message: "hi",
      purchaseRegion: null,
      aiExplanation: null,
      score: 50,
      status: "new",
    });
    expect(signals.confidenceLevel).toBe("insufficient");
    expect(sparseNotes.length).toBeGreaterThan(0);
  });

  it("is stricter but not insufficient when some context exists", () => {
    const { signals } = buildLeadLevelRoutingSignals({
      id: "l2",
      leadType: "buyer",
      message: "hi",
      purchaseRegion: "Montreal",
      aiExplanation: null,
      score: 50,
      status: "new",
    });
    expect(signals.confidenceLevel).not.toBe("insufficient");
  });
});
