import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

describe("records registers rules", () => {
  it("missing record update triggers failure when check required", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "r1",
      metadata: {
        recordsCheckRequired: true,
        recordsRegistersUpToDate: false,
      },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "records_registers_up_to_date")).toBe(true);
  });
});
