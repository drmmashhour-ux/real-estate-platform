import { describe, expect, it } from "vitest";
import { selectBestNegotiationApproaches } from "../approach-selector.engine";
import type { NegotiationScenario, MomentumRiskResult, NegotiationSimulatorContext } from "../negotiation-simulator.types";

const mk = (a: string, o: NegotiationScenario["expectedOutcome"]): NegotiationScenario => ({
  approachKey: a,
  expectedOutcome: o,
  confidence: 0.6,
  rationale: [""],
  likelyNextStep: "",
  likelyObjectionPath: [],
});

describe("selectBestNegotiationApproaches", () => {
  it("pick safer over pushback", () => {
    const s: NegotiationScenario[] = [
      mk("firm_follow_up", "pushback_risk"),
      mk("objection_first", "positive_progress"),
    ];
    const m: MomentumRiskResult = { level: "low", rationale: [] };
    const r = selectBestNegotiationApproaches(s, m);
    expect(r.safestApproach).toBe("objection_first");
  });

  it("penalizes timing pause when momentum high (relative)", () => {
    const s: NegotiationScenario[] = [mk("timing_pause", "neutral_progress"), mk("objection_first", "positive_progress")];
    const m: MomentumRiskResult = { level: "high", rationale: [] };
    const r = selectBestNegotiationApproaches(s, m);
    expect(r.highestUpsideApproach).toBe("objection_first");
  });

  it("ranks non-aggressive paths better when readiness is weak (heuristic; same outcome tier)", () => {
    const s: NegotiationScenario[] = [
      mk("objection_first", "positive_progress"),
      mk("firm_follow_up", "positive_progress"),
      mk("offer_discussion_now", "pushback_risk"),
    ];
    const m: MomentumRiskResult = { level: "low", rationale: [] };
    const weak: NegotiationSimulatorContext = { offerReadinessScore: 0.2, closingReadinessScore: 0.2 };
    const r = selectBestNegotiationApproaches(s, m, weak);
    expect(r.safestApproach).toBe("objection_first");
    expect(r.highestUpsideApproach).toBe("objection_first");
  });
});
