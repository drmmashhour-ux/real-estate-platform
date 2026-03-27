import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateMortgageRequiredDocumentsRule(ctx: {
  employmentStatus: string | null;
  creditRange: string | null;
}): RuleEvaluationResult {
  const hasEmployment = (ctx.employmentStatus ?? "").trim().length > 0;
  const hasCredit = (ctx.creditRange ?? "").trim().length > 0;
  const passed = hasEmployment && hasCredit;
  return {
    ruleCode: "MORTGAGE_REQUIRED_DOCUMENTS_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 8 : -10,
    confidence: 1,
    details: { hasEmployment, hasCredit },
  };
}
