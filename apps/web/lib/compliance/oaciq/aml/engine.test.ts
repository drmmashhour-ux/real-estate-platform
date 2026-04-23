import { describe, expect, it } from "vitest";
import {
  brokerFinalApproval,
  computeAMLScore,
  mergeDealAMLContextRelaxed,
  shouldBlockTransaction,
  validateDealAMLCompliance,
} from "@/lib/compliance/oaciq/aml";
import type { DealAMLComplianceContext } from "@/lib/compliance/oaciq/aml/types";
import { DEFAULT_AML_DEAL_SCAN_RULE_IDS, OACIQ_AML_RULES } from "@/lib/compliance/oaciq/aml/rules";

const strict: DealAMLComplianceContext = {
  illegalActivitySuspected: false,
  identityVerified: true,
  legalCapacityConfirmed: true,
  trustAccountHoldsUnrelatedFunds: false,
  suspiciousPatternDetected: false,
  transactionCompleted: false,
  recordsCompleteAndAccessible: true,
  reportingObligationsUpToDate: true,
  priceVsDeclaredValueMismatch: false,
  nomineeOrHiddenBeneficiarySuspected: false,
  structuringPatternSuspected: false,
  transactionAbnormallyFastWithoutJustification: false,
  mortgageExceedsPropertyValue: false,
};

describe("AML scoring + gate", () => {
  it("computeAMLScore averages triggered rules", () => {
    const hi = OACIQ_AML_RULES.find((r) => r.id === "no_illegal_activity")!;
    const mid = OACIQ_AML_RULES.find((r) => r.id === "abnormal_speed")!;
    expect(computeAMLScore([hi, mid])).toBe(85);
  });

  it("shouldBlockTransaction uses spec thresholds", () => {
    expect(shouldBlockTransaction(0)).toBe("OK");
    expect(shouldBlockTransaction(70)).toBe("OK");
    expect(shouldBlockTransaction(71)).toBe("REVIEW_REQUIRED");
    expect(shouldBlockTransaction(85)).toBe("REVIEW_REQUIRED");
    expect(shouldBlockTransaction(86)).toBe("BLOCK");
  });
});

describe("runAMLEngine", () => {
  it("flags missing identity", () => {
    const out = validateDealAMLCompliance({ ...strict, identityVerified: false }, DEFAULT_AML_DEAL_SCAN_RULE_IDS);
    expect(out.compliant).toBe(false);
    expect(out.triggered_rule_ids).toContain("identity_verification_required");
    expect(out.risk_score).toBe(95);
    expect(out.gate).toBe("BLOCK");
  });

  it("flags illegal activity at critical average", () => {
    const out = validateDealAMLCompliance({ ...strict, illegalActivitySuspected: true });
    expect(out.violations.some((v) => v.rule === "no_illegal_activity")).toBe(true);
    expect(out.gate).toBe("BLOCK");
  });

  it("abnormal speed alone yields REVIEW_REQUIRED not BLOCK", () => {
    const out = validateDealAMLCompliance(
      { ...strict, transactionAbnormallyFastWithoutJustification: true },
      ["abnormal_speed"],
    );
    expect(out.risk_score).toBe(70);
    expect(out.gate).toBe("OK");
  });

  it("passes relaxed default merge", () => {
    const ctx = mergeDealAMLContextRelaxed({});
    const out = validateDealAMLCompliance(ctx);
    expect(out.compliant).toBe(true);
  });

  it("brokerFinalApproval requires signature when gated", () => {
    const evaluation = validateDealAMLCompliance({ ...strict, identityVerified: false });
    const approval = brokerFinalApproval(evaluation);
    expect(approval.requires_signature).toBe(true);
    expect(approval.broker_action).toBe("BLOCK");
    expect(approval.ai_status).toBe("critical");
  });
});
