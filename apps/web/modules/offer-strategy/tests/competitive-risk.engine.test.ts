import { describe, expect, it } from "vitest";
import { computeCompetitiveOfferRisk } from "../competitive-risk.engine";
import type { OfferStrategyContext } from "../offer-strategy.types";

describe("computeCompetitiveOfferRisk", () => {
  it("higher with multiple signals", () => {
    const a = computeCompetitiveOfferRisk({
      competitiveSignals: { mentionedOtherOffers: true, mentionedOtherProperties: true, delayedDecision: true },
    } as OfferStrategyContext);
    expect(a.level).toBe("high");
  });

  it("stays low without signals", () => {
    const a = computeCompetitiveOfferRisk({} as OfferStrategyContext);
    expect(a.level).toBe("low");
  });
});
