import { describe, expect, it } from "vitest";
import { lowConversionHighTrafficDetector } from "../detectors/low-conversion-high-traffic.detector";
import type { ObservationSnapshot } from "../types/domain.types";

describe("low_conversion_high_traffic detector", () => {
  it("emits opportunities when views high and conversion low", () => {
    const obs: ObservationSnapshot = {
      id: "t",
      target: { type: "fsbo_listing", id: "lst_1" },
      signals: [
        {
          id: "s1",
          signalType: "listing_performance",
          observedAt: new Date().toISOString(),
          source: "test",
          confidence: 0.9,
          explanation: "",
          metadata: {
            listingId: "lst_1",
            views: 100,
            contacts: 0,
            conversionRate: 0.001,
            titleLen: 20,
            descriptionLen: 400,
            photoCount: 5,
          },
        },
      ],
      aggregates: { views: 100 },
      facts: {},
      builtAt: new Date().toISOString(),
    };
    const opps = lowConversionHighTrafficDetector.run(obs);
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0]?.proposedActions.some((a) => a.type === "UPDATE_LISTING_COPY")).toBe(true);
  });
});
