import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const duplicatePromotionRuleCode = "duplicate_promotion";

export function evaluateDuplicatePromotion(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.action.type !== "START_PROMOTION") {
    return { ruleCode: duplicatePromotionRuleCode, result: "passed" };
  }

  if (ctx.activePromotionCount >= autonomyConfig.promotions.maxActivePerListing) {
    return {
      ruleCode: duplicatePromotionRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Another active promotion exists — resolve overlap before starting a new one.",
      metadata: { activePromotionCount: ctx.activePromotionCount },
    };
  }

  return { ruleCode: duplicatePromotionRuleCode, result: "passed" };
}
