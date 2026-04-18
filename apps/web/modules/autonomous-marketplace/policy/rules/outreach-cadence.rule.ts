import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const outreachCadenceRuleCode = "outreach_cadence";

export function evaluateOutreachCadence(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.action.type !== "SEND_LEAD_FOLLOWUP") {
    return { ruleCode: outreachCadenceRuleCode, result: "passed" };
  }

  const attempts = ctx.followUpAttempts ?? 0;
  if (attempts >= autonomyConfig.outreach.maxFollowUpsBeforeReviewFlag) {
    return {
      ruleCode: outreachCadenceRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Follow-up attempts exceed cadence — use review flag instead of automated outreach.",
    };
  }

  const hours = ctx.lastOutreachHours;
  if (hours != null && hours < autonomyConfig.outreach.minHoursBetweenFollowUps) {
    return {
      ruleCode: outreachCadenceRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Minimum hours between outreach not met.",
      metadata: { lastOutreachHours: hours },
    };
  }

  return { ruleCode: outreachCadenceRuleCode, result: "passed" };
}
