import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const complianceSensitiveRuleCode = "compliance_sensitive";

export function evaluateComplianceSensitive(ctx: PolicyContext): PolicyRuleEvaluation {
  const list = autonomyConfig.complianceSensitiveTypes as readonly string[];
  if (!list.includes(ctx.action.type)) {
    return { ruleCode: complianceSensitiveRuleCode, result: "passed" };
  }

  if (ctx.autonomyMode === "SAFE_AUTOPILOT" || ctx.autonomyMode === "ASSIST") {
    return {
      ruleCode: complianceSensitiveRuleCode,
      result: "blocked",
      dispositionHint: "ALLOW_WITH_APPROVAL",
      reason: "Compliance-sensitive action — blocked for auto-exec in current mode; approval-only.",
      metadata: { actionType: ctx.action.type },
    };
  }

  return { ruleCode: complianceSensitiveRuleCode, result: "passed" };
}
