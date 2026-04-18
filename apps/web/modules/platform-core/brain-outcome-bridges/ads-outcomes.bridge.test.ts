import { describe, it, expect } from "vitest";
import { extractAdsOutcome } from "./ads-outcomes.bridge";

describe("ads-outcomes.bridge", () => {
  it("returns null when before/after metrics are absent", () => {
    expect(
      extractAdsOutcome({
        id: "d1",
        source: "ADS",
        entityType: "CAMPAIGN",
        entityId: "c1",
        actionType: "SCALE",
        metadata: {},
      }),
    ).toBeNull();
  });
});
