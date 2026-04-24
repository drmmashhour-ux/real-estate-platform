import { describe, expect, it } from "vitest";
import { calculateQcBrokerTaxes } from "@/modules/compliance/tax/gst-qst";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

describe("tax / invoice", () => {
  it("GST/QST calculated correctly", () => {
    const t = calculateQcBrokerTaxes(1000);
    expect(t.gst).toBe(50);
    expect(t.qst).toBe(99.75);
    expect(t.total).toBe(1149.75);
  });

  it("taxable service without invoice blocks", () => {
    const ctx: ComplianceCaseContext = {
      caseId: "x1",
      transactionType: "commission",
      metadata: {
        taxableBrokerageService: true,
        gstRegistrationNumber: "123456789RT0001",
        qstRegistrationNumber: "1234567890TQ0001",
      },
      financialRecord: {
        created: true,
        invoiceGenerated: false,
        gstAmount: 5,
        qstAmount: 9.98,
        total: 114.98,
      },
      documents: {},
    };
    const report = runComplianceEngine(ctx);
    expect(report.decision.blockingFailures.some((x) => x.ruleId === "invoice_required_for_taxable_service")).toBe(
      true,
    );
  });
});
