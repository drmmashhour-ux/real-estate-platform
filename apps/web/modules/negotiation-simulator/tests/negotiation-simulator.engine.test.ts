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
  });
});
