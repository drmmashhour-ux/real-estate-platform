import { describe, expect, it } from "vitest";
import { computeMomentumRisk } from "../momentum-risk.engine";
import type { NegotiationSimulatorContext } from "../negotiation-simulator.types";

describe("computeMomentumRisk", () => {
  it("raises with long silence and competition", () => {
    const c: NegotiationSimulatorContext = {
      silenceGapDays: 6,
      competitiveRisk: "high",
      offerReadinessScore: 0.2,
    };
    const m = computeMomentumRisk(c);
    expect(["medium", "high"].includes(m.level)).toBe(true);
    expect(m.rationale.length).toBeGreaterThan(0);
  });

  it("sparse data stays bounded", () => {
    const c: NegotiationSimulatorContext = {};
    const m = computeMomentumRisk(c);
    expect(m.level).toBe("low");
    expect(m.rationale[0] ?? "").toBeTruthy();
  });
});
