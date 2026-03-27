import { describe, it, expect } from "vitest";
import { runPricingAgent } from "../agents/pricing-agent.js";
import { runFraudRiskAgent } from "../agents/fraud-risk-agent.js";
import { runBookingIntegrityAgent } from "../agents/booking-integrity-agent.js";

describe("Pricing Agent", () => {
  it("returns recommended price and range", () => {
    const out = runPricingAgent({
      location: "NYC",
      demandLevel: "medium",
      nearbyPricesCents: [10000, 12000, 14000],
    });
    expect(out.recommendedNightlyCents).toBeGreaterThan(0);
    expect(out.priceRangeMinCents).toBeLessThanOrEqual(out.recommendedNightlyCents);
    expect(out.priceRangeMaxCents).toBeGreaterThanOrEqual(out.recommendedNightlyCents);
    expect(out.confidenceScore).toBeGreaterThan(0);
  });
});

describe("Fraud Risk Agent", () => {
  it("returns allow for low signals", () => {
    const out = runFraudRiskAgent({ bookingId: "b1" });
    expect(out.recommendedAction).toBe("allow");
    expect(out.fraudRiskScore).toBeLessThan(0.4);
  });
  it("returns flag for high-risk signals", () => {
    const out = runFraudRiskAgent({
      signals: [
        { type: "MULTIPLE_ACCOUNTS", score: 0.9 },
        { type: "PAYMENT_ABUSE", score: 0.8 },
      ],
    });
    expect(out.autoFlag).toBe(true);
    expect(["flag_for_review", "review", "block"]).toContain(out.recommendedAction);
  });
});

describe("Booking Integrity Agent", () => {
  it("returns approve for normal booking", () => {
    const out = runBookingIntegrityAgent({ bookingId: "b1", nights: 3 });
    expect(out.suggestedAction).toBe("approve");
    expect(out.anomalyStatus).toBe("normal");
  });
  it("returns review or hold for overlap attempt", () => {
    const out = runBookingIntegrityAgent({ overlapAttempts: 1 });
    expect(out.suggestedAction).not.toBe("approve");
    expect(out.anomalyStatus).not.toBe("normal");
  });
});
