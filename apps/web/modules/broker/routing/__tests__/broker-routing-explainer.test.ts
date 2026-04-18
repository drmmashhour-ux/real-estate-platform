import { describe, expect, it } from "vitest";
import { buildBrokerRoutingWhy } from "@/modules/broker/routing/broker-routing-explainer.service";

describe("buildBrokerRoutingWhy", () => {
  it("returns at most 5 lines", () => {
    const why = buildBrokerRoutingWhy({
      lead: { intent: "buy", regionKey: "x", regionLabel: "X" },
      broker: {
        brokerId: "b",
        name: "B",
        regionKeys: ["x"],
        launchPersonaChoice: null,
        growthOutreachSegment: null,
      },
      breakdown: {
        regionFitScore: 90,
        intentFitScore: 88,
        performanceFitScore: 80,
        responseFitScore: 70,
        availabilityFitScore: 75,
      },
    });
    expect(why.length).toBeLessThanOrEqual(5);
  });
});
