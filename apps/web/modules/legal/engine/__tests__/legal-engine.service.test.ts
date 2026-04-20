import { describe, expect, it } from "vitest";
import { evaluateLegalRisk, LEGAL_RISK_ALERT_MESSAGE, legalRiskAlertMessage } from "../legal-engine.service";

describe("evaluateLegalRisk", () => {
  it("matches baseline Phase 3 stacking", () => {
    const r = evaluateLegalRisk({
      roofConditionUnknown: true,
      highValueProperty: true,
      sellerProvidedInfo: true,
      incompleteDisclosure: true,
      inspectionLimited: true,
      sellerSilenceDuringInspection: false,
    });
    expect(r.score).toBe(30 + 40 + 20);
    expect(r.flags).toContain("POTENTIAL_LATENT_DEFECT");
    expect(r.flags).toContain("MISREPRESENTATION_RISK");
    expect(r.flags).toContain("INSPECTION_LIMITATION");
    expect(r.riskLevel).toBe("CRITICAL");
  });

  it("applies Phase 7 seller + latent + broker protection flags without LLM", () => {
    const r = evaluateLegalRisk({
      knownDefect: true,
      notDisclosed: true,
      hiddenDefect: true,
      serious: true,
      priorToSale: true,
      brokerDisclosedSource: true,
      attemptedVerification: true,
    });
    expect(r.badFaith).toBe(true);
    expect(r.latentDefectIndicated).toBe(true);
    expect(r.brokerProtectionApplied).toBe(true);
    expect(r.flags).toContain("BROKER_PROTECTION_RULE");
  });

  it("surfaces admin alert copy only for HIGH/CRITICAL", () => {
    expect(
      legalRiskAlertMessage(evaluateLegalRisk({ sellerProvidedInfo: true, incompleteDisclosure: true })),
    ).toBeNull();
    expect(
      legalRiskAlertMessage(
        evaluateLegalRisk({
          sellerProvidedInfo: true,
          incompleteDisclosure: true,
          inspectionLimited: true,
          roofConditionUnknown: true,
          highValueProperty: true,
        }),
      ),
    ).toBe(LEGAL_RISK_ALERT_MESSAGE);
  });
});
