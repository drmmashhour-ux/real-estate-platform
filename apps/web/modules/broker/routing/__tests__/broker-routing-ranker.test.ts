import { describe, expect, it } from "vitest";
import { rankBrokerRoutingCandidates } from "@/modules/broker/routing/broker-routing-ranker.service";
import type { BrokerRoutingCandidate } from "@/modules/broker/routing/broker-routing.types";

const mk = (partial: Partial<BrokerRoutingCandidate> & Pick<BrokerRoutingCandidate, "brokerId" | "rankScore">): BrokerRoutingCandidate => ({
  brokerName: "x",
  fitBand: "good",
  breakdown: {
    regionFitScore: 50,
    intentFitScore: 50,
    performanceFitScore: partial.breakdown?.performanceFitScore ?? 50,
    responseFitScore: partial.breakdown?.responseFitScore ?? 50,
    availabilityFitScore: 50,
  },
  why: [],
  ...partial,
});

describe("rankBrokerRoutingCandidates", () => {
  it("sorts by rankScore then performance then response; caps at 5", () => {
    const input: BrokerRoutingCandidate[] = [
      mk({ brokerId: "a", rankScore: 60, breakdown: { regionFitScore: 50, intentFitScore: 50, performanceFitScore: 40, responseFitScore: 40, availabilityFitScore: 50 } }),
      mk({ brokerId: "b", rankScore: 70, breakdown: { regionFitScore: 50, intentFitScore: 50, performanceFitScore: 90, responseFitScore: 10, availabilityFitScore: 50 } }),
      mk({ brokerId: "c", rankScore: 70, breakdown: { regionFitScore: 50, intentFitScore: 50, performanceFitScore: 90, responseFitScore: 20, availabilityFitScore: 50 } }),
    ];
    const r = rankBrokerRoutingCandidates(input);
    expect(r.length).toBeLessThanOrEqual(5);
    expect(r[0]?.brokerId).toBe("c");
    expect(r[1]?.brokerId).toBe("b");
  });

  it("caps via max parameter", () => {
    const input: BrokerRoutingCandidate[] = [
      mk({ brokerId: "a", rankScore: 90 }),
      mk({ brokerId: "b", rankScore: 89 }),
      mk({ brokerId: "c", rankScore: 88 }),
    ];
    const r = rankBrokerRoutingCandidates(input, 2);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.brokerId).join(",")).toBe("a,b");
  });

  it("does not mutate input array order in place", () => {
    const input = [mk({ brokerId: "z", rankScore: 1 })];
    const copy = [...input];
    rankBrokerRoutingCandidates(input);
    expect(input).toEqual(copy);
  });
});
