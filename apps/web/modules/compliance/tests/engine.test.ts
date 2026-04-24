import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

const baseCtx = (over: Partial<ComplianceCaseContext> = {}): ComplianceCaseContext => ({
  caseId: "case-1",
  ...over,
});

describe("unified compliance engine", () => {
  it("blocks advertising without signed contract", () => {
    const report = runComplianceEngine(
      baseCtx({
        advertising: {
          active: true,
          signedBrokerageContractPresent: false,
          containsRequiredStatements: true,
          containsMisleadingClaims: false,
          mentionsSoldPrice: false,
          mentionsGuarantee: false,
          holdsValidLicense: true,
        },
      }),
    );
    expect(report.decision.status).toBe("blocked");
    expect(report.decision.blockingFailures.some((f) => f.ruleId === "advertising_requires_signed_contract")).toBe(
      true,
    );
  });

  it("blocks sold price disclosure", () => {
    const report = runComplianceEngine(
      baseCtx({
        advertising: {
          active: true,
          signedBrokerageContractPresent: true,
          containsRequiredStatements: true,
          containsMisleadingClaims: false,
          mentionsSoldPrice: true,
          mentionsGuarantee: false,
          holdsValidLicense: true,
        },
      }),
    );
    expect(report.decision.blockingFailures.some((f) => f.ruleId === "no_sold_price_disclosure")).toBe(true);
  });

  it("flags performance guarantee", () => {
    const report = runComplianceEngine(
      baseCtx({
        advertising: {
          active: true,
          signedBrokerageContractPresent: true,
          containsRequiredStatements: true,
          containsMisleadingClaims: false,
          mentionsSoldPrice: false,
          mentionsGuarantee: true,
          holdsValidLicense: true,
        },
      }),
    );
    const guar = report.results.find((r) => r.ruleId === "no_improper_performance_guarantee");
    expect(guar?.passed).toBe(false);
  });
});
