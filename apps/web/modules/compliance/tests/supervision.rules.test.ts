import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

describe("solo broker supervision", () => {
  it("applies self-governance supervision rule", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "s1",
      metadata: {
        soloBroker: true,
        agencyOperation: false,
        soloSelfGovernanceProcedure: false,
      },
    };
    const report = runComplianceEngine(ctx);
    const sup = report.results.find((r) => r.ruleId === "supervision_procedure_defined");
    expect(sup?.passed).toBe(false);
  });
});
