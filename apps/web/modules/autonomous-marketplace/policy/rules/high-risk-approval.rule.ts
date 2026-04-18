import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const highRiskApprovalRuleCode = "high_risk_approval";

export function evaluateHighRiskApproval(ctx: PolicyContext): PolicyRuleEvaluation {
  const high = autonomyConfig.highRiskActionTypes as readonly string[];
  const typeIsHigh = high.includes(ctx.action.type);
  const riskIsElevated = ctx.action.risk === "HIGH" || ctx.action.risk === "CRITICAL";
  if (!typeIsHigh && !riskIsElevated) {
    return { ruleCode: highRiskApprovalRuleCode, result: "passed" };
  }

  if (ctx.autonomyMode !== "FULL_AUTOPILOT_APPROVAL" && ctx.autonomyMode !== "SAFE_AUTOPILOT") {
    return {
      ruleCode: highRiskApprovalRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_WITH_APPROVAL",
      reason: "High-risk action requires elevated autonomy mode or human approval.",
      metadata: { actionType: ctx.action.type },
    };
  }

  return { ruleCode: highRiskApprovalRuleCode, result: "passed" };
}
