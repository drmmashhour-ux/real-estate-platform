import { describe, expect, it } from "vitest";
import { selectBestNegotiationApproaches } from "../approach-selector.engine";
import type { NegotiationScenario, MomentumRiskResult } from "../negotiation-simulator.types";

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
});
