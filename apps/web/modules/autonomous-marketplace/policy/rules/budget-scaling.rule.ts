import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const budgetScalingRuleCode = "budget_scaling";

export function evaluateBudgetScaling(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.action.type !== "SCALE_CAMPAIGN_BUDGET") {
    return { ruleCode: budgetScalingRuleCode, result: "passed" };
  }

  const meta = ctx.action.metadata as { suggestedScalePct?: number };
  const pct = meta.suggestedScalePct ?? 0;
  if (pct > autonomyConfig.budget.maxScalePctPerRun) {
    return {
      ruleCode: budgetScalingRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: `Scale ${pct}% exceeds max ${autonomyConfig.budget.maxScalePctPerRun}%.`,
    };
  }

  return { ruleCode: budgetScalingRuleCode, result: "passed" };
}
