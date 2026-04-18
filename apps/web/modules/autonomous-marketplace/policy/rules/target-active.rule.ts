import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const targetActiveRuleCode = "target_active";

export function evaluateTargetActive(ctx: PolicyContext): PolicyRuleEvaluation {
  const needsTarget =
    ctx.action.target.type === "fsbo_listing" ||
    ctx.action.target.type === "syria_listing" ||
    ctx.action.target.type === "lead" ||
    ctx.action.target.type === "campaign";

  if (!needsTarget) {
    return { ruleCode: targetActiveRuleCode, result: "passed" };
  }

  if (!ctx.action.target.id) {
    return {
      ruleCode: targetActiveRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Target id missing — cannot execute.",
    };
  }

  if ((ctx.action.type === "APPLY_PRICE_CHANGE" || ctx.action.type === "START_PROMOTION") && !ctx.targetActive) {
    return {
      ruleCode: targetActiveRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Target listing is not active/published.",
    };
  }

  return { ruleCode: targetActiveRuleCode, result: "passed" };
}
