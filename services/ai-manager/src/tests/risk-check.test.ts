import { describe, it, expect } from "vitest";
import { runRiskCheck } from "../services/risk-check.service.js";

describe("risk-check", () => {
  it("returns allow for low/no signals", () => {
    const out = runRiskCheck({ bookingId: "b1" });
    expect(out.recommendedAction).toBe("allow");
    expect(out.fraudRiskScore).toBeLessThan(0.4);
  });

  it("returns review or block for high-risk signals", () => {
    const out = runRiskCheck({
      signals: [
        { type: "MULTIPLE_ACCOUNTS", score: 0.9 },
        { type: "PAYMENT_FRAUD", score: 0.8 },
      ],
    });
    expect(out.fraudRiskScore).toBeGreaterThan(0.5);
    expect(["review", "block"]).toContain(out.recommendedAction);
  });
});
