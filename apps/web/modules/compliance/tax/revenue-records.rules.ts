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

export const revenueRecordsRules: ComplianceRule[] = [
  {
    id: "financial_record_created",
    category: "tax",
    evaluate(ctx) {
      if (!ctx.transactionType || !["commission", "deposit", "cash_receipt", "refund"].includes(ctx.transactionType)) {
        return null;
      }
      const ok = ctx.financialRecord?.created === true;
      return r(
        "financial_record_created",
        ok,
        ok ? "low" : "critical",
        "FIN_RECORD",
        "Financial compliance record",
        ok ? "Financial compliance record created." : "Create financial compliance record for this movement.",
        !ok,
      );
    },
  },
  {
    id: "revenue_export_ready",
    category: "tax",
    evaluate(ctx) {
      if (ctx.metadata?.revenueExportRequired !== true) return null;
      const ok = ctx.metadata.revenueExportReady === true;
      return r(
        "revenue_export_ready",
        ok,
        ok ? "low" : "medium",
        "REV_EXPORT",
        "Revenue export",
        ok ? "Revenue records exportable for accounting / Revenue Québec." : "Prepare structured export for revenue authority review.",
        false,
      );
    },
  },
];
