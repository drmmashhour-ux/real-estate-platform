import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

describe("AML rules", () => {
  it("high AML score forces blocking failure", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "a1",
      aml: {
        suspiciousIndicators: ["unusual_geography", "structuring", "nominee"],
        highRisk: true,
        largeCashTransaction: false,
        reportingRequired: false,
        recordKeepingComplete: false,
        indicatorScore: 80,
      },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.status).toBe("blocked");
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "aml_indicator_score_high")).toBe(true);
  });

  it("identity verification incomplete blocks when required", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "a2",
      identityVerification: { required: true, completed: false },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "identity_verification_completed")).toBe(true);
  });
});
