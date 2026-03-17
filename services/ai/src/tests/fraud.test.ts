import { describe, it, expect } from "vitest";
import { checkFraud } from "../services/fraud.service.js";

describe("fraud-check", () => {
  it("returns allow for low/no signals", () => {
    const out = checkFraud({ bookingId: "b1" });
    expect(out.recommendedAction).toBe("allow");
    expect(out.riskScore).toBeLessThan(0.4);
  });

  it("returns review or block for high signals", () => {
    const out = checkFraud({
      signals: [
        { type: "PAYMENT_FRAUD", score: 0.9 },
        { type: "SUSPICIOUS_BOOKING", score: 0.8 },
      ],
    });
    expect(out.riskScore).toBeGreaterThan(0.5);
    expect(["review", "block"]).toContain(out.recommendedAction);
    expect(out.factors.length).toBe(2);
  });
});
