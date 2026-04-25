import { describe, expect, it } from "vitest";
import { runOfferStrategy } from "../offer-strategy.engine";
import type { OfferStrategyContext } from "../offer-strategy.types";

describe("runOfferStrategy", () => {
  it("returns a full object", () => {
    const o = runOfferStrategy({
      visitCompleted: false,
      financingReadiness: "medium",
      offerDiscussed: true,
    } as OfferStrategyContext);
    expect(o.readiness.label).toBeDefined();
    expect(o.posture.style).toBeDefined();
    expect(o.competitiveRisk.level).toBeDefined();
    expect(o.recommendations.length).toBeGreaterThan(0);
  });
});
