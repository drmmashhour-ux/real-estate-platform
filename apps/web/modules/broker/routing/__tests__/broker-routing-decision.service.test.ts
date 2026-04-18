import { describe, expect, it } from "vitest";
import { computeRoutingConfidence } from "@/modules/broker/routing/broker-routing-decision.service";
import type { BrokerRoutingCandidate } from "@/modules/broker/routing/broker-routing.types";

const baseBreakdown = {
  regionFitScore: 80,
  intentFitScore: 75,
  performanceFitScore: 82,
  responseFitScore: 70,
  availabilityFitScore: 65,
};

function cand(
  overrides: Partial<BrokerRoutingCandidate> & Pick<BrokerRoutingCandidate, "rankScore" | "fitBand">,
): BrokerRoutingCandidate {
  return {
    brokerId: "b1",
    brokerName: "Test",
    why: [],
    breakdown: baseBreakdown,
    ...overrides,
  };
}

describe("computeRoutingConfidence", () => {
  it("is higher for strong + performance and wide gap to #2", () => {
    const high = computeRoutingConfidence(cand({ rankScore: 82, fitBand: "strong" }), cand({ rankScore: 58, fitBand: "good", brokerId: "b2" }));
    const low = computeRoutingConfidence(cand({ rankScore: 60, fitBand: "watch" }), cand({ rankScore: 58, fitBand: "watch", brokerId: "b2" }));
    expect(high).toBeGreaterThan(low);
  });

  it("is bounded 0–100", () => {
    const s = computeRoutingConfidence(cand({ rankScore: 90, fitBand: "strong" }), undefined);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
