import { describe, expect, it } from "vitest";
import { buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";

describe("signalsEngine", () => {
  it("normalizes listing signals deterministically", () => {
    const signals = buildListingSignals({
      priceCents: 45000000,
      marketPriceCents: 50000000,
      rentalDemand: 72,
      locationScore: 68,
      trustScore: 74,
      riskScore: 31,
      freshnessDays: 2,
    });

    expect(signals.price_vs_market.value).toBeGreaterThanOrEqual(50);
    expect(signals.fraud_risk_signal.value).toBe(31);
    expect(signals.freshness_signal.value).toBe(82);
  });
});
