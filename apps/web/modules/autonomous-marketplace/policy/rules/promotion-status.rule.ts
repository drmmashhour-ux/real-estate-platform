import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const promotionStatusRuleCode = "promotion_status";

export function evaluatePromotionStatus(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.action.type !== "START_PROMOTION" && ctx.action.type !== "STOP_PROMOTION") {
    return { ruleCode: promotionStatusRuleCode, result: "passed" };
  }

  if (!ctx.targetActive) {
    return {
      ruleCode: promotionStatusRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Only published/active listings may receive promotion actions.",
    };
  }

  return { ruleCode: promotionStatusRuleCode, result: "passed" };
}
