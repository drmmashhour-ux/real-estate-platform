import { describe, expect, it } from "vitest";
import { computeOfferReadiness } from "../offer-readiness.engine";
import type { OfferStrategyContext } from "../offer-strategy.types";

describe("computeOfferReadiness", () => {
  it("stays not_ready for weak context", () => {
    const r = computeOfferReadiness({
      engagementScore: 20,
      visitCompleted: false,
      financingReadiness: "weak",
      silenceGapDays: 10,
      objections: { objections: [{ type: "price", severity: "high" }] },
    } as OfferStrategyContext);
    expect(r.score).toBeLessThan(50);
  });

  it("rises with visit and financing strength", () => {
    const r = computeOfferReadiness({
      closingReadinessScore: 70,
      visitCompleted: true,
      financingReadiness: "strong",
      engagementScore: 70,
    } as OfferStrategyContext);
    expect(r.score).toBeGreaterThan(60);
  });
});
