import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
): ComplianceRuleResult {
  return { ruleId: id, passed, severity, code, title, message, blocking };
}

export const invoiceRules: ComplianceRule[] = [
  {
    id: "invoice_required_for_taxable_service",
    category: "tax",
    evaluate(ctx) {
      if (ctx.transactionType !== "commission" && ctx.metadata?.taxableBrokerageService !== true) return null;
      const ok = ctx.financialRecord?.invoiceGenerated === true || Boolean(ctx.documents?.invoiceId);
      return r(
        "invoice_required_for_taxable_service",
        ok,
        ok ? "low" : "critical",
        "TAX_INVOICE",
        "Tax invoice",
        ok ? "Invoice generated for taxable service." : "Taxable brokerage services require an invoice before completion.",
        !ok,
      );
    },
  },
  {
    id: "gst_qst_calculated",
    category: "tax",
    evaluate(ctx) {
      if (ctx.metadata?.taxableBrokerageService !== true) return null;
      const has =
        ctx.financialRecord?.gstAmount != null &&
        ctx.financialRecord?.qstAmount != null &&
        ctx.financialRecord?.total != null;
      return r(
        "gst_qst_calculated",
        has,
        has ? "low" : "high",
        "TAX_CALC",
        "GST/QST amounts",
        has ? "GST and QST computed on invoice." : "Calculate and display GST and QST on taxable supplies.",
        !has,
      );
    },
  },
  {
    id: "tax_registration_numbers_present",
    category: "tax",
    evaluate(ctx) {
      if (ctx.metadata?.taxableBrokerageService !== true) return null;
      const gstReg = typeof ctx.metadata.gstRegistrationNumber === "string" && !!ctx.metadata.gstRegistrationNumber.trim();
      const qstReg = typeof ctx.metadata.qstRegistrationNumber === "string" && !!ctx.metadata.qstRegistrationNumber.trim();
      const ok = gstReg && qstReg;
      return r(
        "tax_registration_numbers_present",
        ok,
        ok ? "low" : "high",
        "TAX_REG",
        "GST/QST registration on invoice",
        ok ? "Registration numbers present for Revenue Québec readiness." : "Include GST and QST registration numbers on invoices.",
        !ok,
      );
    },
  },
];
