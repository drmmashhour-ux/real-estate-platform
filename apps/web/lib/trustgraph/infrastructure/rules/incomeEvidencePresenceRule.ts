import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateIncomeEvidencePresenceRule(ctx: { income: number }): RuleEvaluationResult {
  const min = getPhase5GrowthConfig().mortgageReadiness.minIncome;
  const passed = Number.isFinite(ctx.income) && ctx.income >= min;
  return {
    ruleCode: "INCOME_EVIDENCE_PRESENCE_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 10 : -12,
    confidence: 1,
    details: { income: ctx.income, minIncome: min },
  };
}
