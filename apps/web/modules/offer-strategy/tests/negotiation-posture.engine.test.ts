import { describe, expect, it } from "vitest";
import { recommendNegotiationPosture } from "../negotiation-posture.engine";
import type { OfferBlocker, OfferReadinessResult, OfferStrategyContext } from "../offer-strategy.types";
import type { CompetitiveOfferRisk } from "../offer-strategy.types";

describe("recommendNegotiationPosture", () => {
  it("holds when not ready and high blockers", () => {
    const p = recommendNegotiationPosture(
      {} as OfferStrategyContext,
      { score: 20, label: "not_ready", rationale: [] },
      [
        { key: "a", label: "A", severity: "high", rationale: [] },
        { key: "b", label: "B", severity: "high", rationale: [] },
      ] as OfferBlocker[],
      { level: "low", rationale: [] } as CompetitiveOfferRisk
    );
    expect(p.style).toBe("hold_and_nurture");
  });

  it("softens when competition risk is high and posture was strong", () => {
    const p = recommendNegotiationPosture(
      { financingReadiness: "strong" } as OfferStrategyContext,
      { score: 88, label: "high_offer_intent", rationale: [] } as OfferReadinessResult,
      [] as OfferBlocker[],
      { level: "high", rationale: ["x"] } as CompetitiveOfferRisk
    );
    expect(p.style).not.toBe("confident_offer_push");
  });
});
