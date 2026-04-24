import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

describe("trust account rules", () => {
  it("cash payment requires receipt generated", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "t1",
      transactionType: "cash_receipt",
      paymentMethod: "cash",
      trustAccountId: "tr1",
      contractId: "c1",
      payer: { fullName: "Jane Doe" },
      documents: {},
      financialRecord: { created: true, receiptGenerated: false },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "cash_receipt_generated")).toBe(true);
  });

  it("missing payer identity blocks trust acceptance", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "t2",
      transactionType: "deposit",
      trustAccountId: "tr1",
      contractId: "c1",
      payer: { fullName: "" },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "payer_identified")).toBe(true);
  });

  it("client funds require trust account linkage", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "t3",
      transactionType: "deposit",
      trustAccountId: null,
      contractId: "c1",
      payer: { fullName: "A" },
      metadata: { trustAccountExempt: false },
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "trust_account_required_for_client_funds")).toBe(
      true,
    );
  });
});
