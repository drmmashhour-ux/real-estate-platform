import { describe, expect, it } from "vitest";
import { simulateNegotiationApproach } from "../approach-simulation.engine";
import type { NegotiationSimulatorContext } from "../negotiation-simulator.types";

describe("simulateNegotiationApproach", () => {
  it("weak readiness + firm = pushback lean", () => {
    const c: NegotiationSimulatorContext = {
      offerReadinessScore: 0.2,
      closingReadinessScore: 0.2,
      blockers: [{ k: 1 }, { k: 2 }, { k: 3 }],
    };
    const s = simulateNegotiationApproach(c, "firm_follow_up");
    expect(s.expectedOutcome).toBe("pushback_risk");
    expect(s.confidence).toBeGreaterThan(0.2);
  });

  it("strong readiness + offer discussion with visit and financing = positive lean (scenario)", () => {
    const c: NegotiationSimulatorContext = {
      offerReadinessScore: 0.7,
      closingReadinessScore: 0.7,
      visitCompleted: true,
      financingReadiness: "strong",
    };
    const s = simulateNegotiationApproach(c, "offer_discussion_now");
    expect(s.expectedOutcome).toBe("positive_progress");
  });

  it("high competition + timing pause = stall lean", () => {
    const c: NegotiationSimulatorContext = { competitiveRisk: "high" };
    const s = simulateNegotiationApproach(c, "timing_pause");
    expect(s.expectedOutcome).toBe("stall_risk");
  });

  it("objection-first with blockers and medium readiness = positive lean (scenario)", () => {
    const c: NegotiationSimulatorContext = {
      offerReadinessScore: 0.45,
      blockers: [{ a: 1 }, { a: 2 }],
    };
    const s = simulateNegotiationApproach(c, "objection_first");
    expect(s.expectedOutcome).toBe("positive_progress");
  });
});
