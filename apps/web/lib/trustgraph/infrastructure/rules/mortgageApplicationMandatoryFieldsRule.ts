import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateMortgageApplicationMandatoryFieldsRule(ctx: {
  propertyPrice: number;
  downPayment: number;
  income: number;
  timeline: string;
}): RuleEvaluationResult {
  const required = getPhase5GrowthConfig().mortgageReadiness.requiredFields;
  const checks: Record<string, boolean> = {
    propertyPrice: Number.isFinite(ctx.propertyPrice) && ctx.propertyPrice > 0,
    downPayment: Number.isFinite(ctx.downPayment) && ctx.downPayment >= 0,
    income: Number.isFinite(ctx.income) && ctx.income > 0,
    timeline: (ctx.timeline ?? "").trim().length > 0,
  };
  const passed = required.every((k) => checks[k]);
  return {
    ruleCode: "MORTGAGE_APPLICATION_MANDATORY_FIELDS_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 8 : -15,
    confidence: 1,
    details: { checks, required },
  };
}
