import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { evaluateIncomeEvidencePresenceRule } from "@/lib/trustgraph/infrastructure/rules/incomeEvidencePresenceRule";
import { evaluateLiabilityDisclosureCompletenessRule } from "@/lib/trustgraph/infrastructure/rules/liabilityDisclosureCompletenessRule";
import { evaluateMortgageApplicationMandatoryFieldsRule } from "@/lib/trustgraph/infrastructure/rules/mortgageApplicationMandatoryFieldsRule";
import { evaluateMortgageRequiredDocumentsRule } from "@/lib/trustgraph/infrastructure/rules/mortgageRequiredDocumentsRule";

export function collectMortgageReadinessRuleResults(ctx: {
  propertyPrice: number;
  downPayment: number;
  income: number;
  timeline: string;
  employmentStatus: string | null;
  creditRange: string | null;
}): RuleEvaluationResult[] {
  return [
    evaluateMortgageApplicationMandatoryFieldsRule({
      propertyPrice: ctx.propertyPrice,
      downPayment: ctx.downPayment,
      income: ctx.income,
      timeline: ctx.timeline,
    }),
    evaluateIncomeEvidencePresenceRule({ income: ctx.income }),
    evaluateMortgageRequiredDocumentsRule({
      employmentStatus: ctx.employmentStatus,
      creditRange: ctx.creditRange,
    }),
    evaluateLiabilityDisclosureCompletenessRule({ creditRange: ctx.creditRange }),
  ];
}
