import { describe, expect, it } from "vitest";
import { runNegotiationSimulator } from "../negotiation-simulator.engine";
import type { NegotiationSimulatorContext } from "../negotiation-simulator.types";

describe("runNegotiationSimulator", () => {
  it("returns a full output shape", () => {
    const c: NegotiationSimulatorContext = { dealId: "d1" };
    const o = runNegotiationSimulator(c);
    expect(o.scenarios.length).toBe(7);
    expect(o.momentumRisk.level).toBeDefined();
    expect(o.coachNotes.length).toBeGreaterThan(0);
  });

  it("contrasts firm vs objection in weak-readiness", () => {
    const c: NegotiationSimulatorContext = {
      offerReadinessScore: 0.25,
      blockers: [1, 2, 3, 4],
    };
    const o = runNegotiationSimulator(c);
    const firm = o.scenarios.find((s) => s.approachKey === "firm_follow_up");
    const objf = o.scenarios.find((s) => s.approachKey === "objection_first");
    expect(firm?.expectedOutcome).toBe("pushback_risk");
    expect(objf?.expectedOutcome).not.toBe("pushback_risk");
    if (c.offerReadinessScore! < 0.38) {
      expect(o.safestApproach).not.toBe("offer_discussion_now");
    }
  });

  it("strong-readiness + low competition: offer_discussion can rank as upside in scenario (not a guarantee)", () => {
    const c: NegotiationSimulatorContext = {
      offerReadinessScore: 0.72,
      closingReadinessScore: 0.7,
      visitCompleted: true,
      financingReadiness: "strong",
      competitiveRisk: "low",
    };
    const o = runNegotiationSimulator(c);
    const od = o.scenarios.find((s) => s.approachKey === "offer_discussion_now");
    expect(od?.expectedOutcome).toBe("positive_progress");
  });

  it("financing-weak: objection forecast is non-empty", () => {
    const c: NegotiationSimulatorContext = { financingReadiness: "weak" };
    const o = runNegotiationSimulator(c);
    expect(o.objectionForecast.likelyObjections.length).toBeGreaterThan(0);
  });

  it("competition + long silence + strong readiness: momentum risk can read high in this heuristic (not a prediction)", () => {
    const c: NegotiationSimulatorContext = {
      competitiveRisk: "high",
      silenceGapDays: 8,
      offerReadinessScore: 0.6,
    };
    const o = runNegotiationSimulator(c);
    expect(o.momentumRisk.level).toBe("high");
  });
});
