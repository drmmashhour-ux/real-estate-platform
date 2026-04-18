import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const autopilotModeRuleCode = "autopilot_mode";

export function evaluateAutopilotMode(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.autonomyMode === "OFF") {
    return {
      ruleCode: autopilotModeRuleCode,
      result: "blocked",
      dispositionHint: "ALLOW_DRY_RUN",
      reason: "Autonomy mode is OFF — only preview/dry-run allowed.",
    };
  }

  if (
    ctx.autonomyMode === "ASSIST" &&
    ctx.action.type !== "REQUEST_HUMAN_APPROVAL" &&
    ctx.action.type !== "CREATE_TASK" &&
    ctx.action.type !== "FLAG_REVIEW"
  ) {
    return {
      ruleCode: autopilotModeRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_DRY_RUN",
      reason: "ASSIST mode — execution disabled except tasks/approval requests unless explicitly enabled per action.",
    };
  }

  return { ruleCode: autopilotModeRuleCode, result: "passed" };
}
