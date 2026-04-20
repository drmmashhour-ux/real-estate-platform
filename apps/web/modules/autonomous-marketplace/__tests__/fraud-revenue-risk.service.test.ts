import { describe, expect, it } from "vitest";
import { evaluateFraudRevenueRisk } from "../governance/fraud-revenue-risk.service";

describe("evaluateFraudRevenueRisk", () => {
  it("fraud flag pushes approval-oriented scoring", () => {
    const r = evaluateFraudRevenueRisk({ fraudFlag: true });
    expect(r.score).toBeGreaterThanOrEqual(55);
    expect(r.reasons.some((x) => x.includes("Fraud"))).toBe(true);
  });

  it("payout anomaly alone adds moderate stress", () => {
    const r = evaluateFraudRevenueRisk({
      signals: [{ type: "payout_anomaly", severity: "warning" }],
    });
    expect(r.score).toBeGreaterThanOrEqual(25);
    expect(r.level === "MEDIUM" || r.level === "HIGH").toBe(true);
  });

  it("severe payout anomaly with large payout volume compounds", () => {
    const r = evaluateFraudRevenueRisk({
      signals: [{ type: "payout_anomaly", severity: "critical" }],
      revenueFacts: {
        payoutVolume30d: 30000,
        grossBookingValue30d: 100000,
        anomalyScore: 0.92,
      },
    });
    expect(r.level === "HIGH" || r.level === "CRITICAL").toBe(true);
    expect(r.requiresBlock || r.requiresApproval).toBe(true);
  });

  it("quiet merchant has low posture", () => {
    const r = evaluateFraudRevenueRisk({
      fraudFlag: false,
      signals: [],
      revenueFacts: { grossBookingValue30d: 1000, refunds30d: 0, chargebacks30d: 0 },
    });
    expect(r.level).toBe("LOW");
    expect(r.requiresBlock).toBe(false);
  });
});
