import { describe, expect, it } from "vitest";
import { evaluateBrokerProtection } from "../legal-rules.service";

describe("evaluateBrokerProtection", () => {
  it("marks brokerProtected when disclosure, verification, and warning are present", () => {
    const r = evaluateBrokerProtection({
      brokerDisclosedSource: true,
      attemptedVerification: true,
      disclosureWarningIssued: true,
      sellerUncooperative: false,
      forwardedSellerInfoWithoutWarning: false,
      forwardedWithoutVerificationAttempt: false,
    });
    expect(r.brokerProtected).toBe(true);
    expect(r.brokerRiskScore).toBe(0);
    expect(r.reasoning).toContain("Broker protection");
  });

  it("clears broker protection when forwarding without warning and without verification", () => {
    const r = evaluateBrokerProtection({
      brokerDisclosedSource: false,
      attemptedVerification: false,
      disclosureWarningIssued: false,
      sellerUncooperative: false,
      forwardedSellerInfoWithoutWarning: true,
      forwardedWithoutVerificationAttempt: true,
    });
    expect(r.brokerProtected).toBe(false);
    expect(r.brokerRiskScore).toBeGreaterThanOrEqual(45);
  });

  it("reduces broker fault probability when seller is uncooperative", () => {
    const r = evaluateBrokerProtection({
      brokerDisclosedSource: false,
      attemptedVerification: false,
      disclosureWarningIssued: false,
      sellerUncooperative: true,
      forwardedSellerInfoWithoutWarning: false,
      forwardedWithoutVerificationAttempt: false,
    });
    expect(r.brokerFaultProbabilityReduction).toBe(25);
  });
});
