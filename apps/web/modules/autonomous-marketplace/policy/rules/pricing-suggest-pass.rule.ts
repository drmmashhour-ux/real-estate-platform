import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const pricingSuggestPassRuleCode = "pricing_suggest_pass";

/** SUGGEST_PRICE_CHANGE stays advisory — separate from live apply guardrails. */
export function evaluatePricingSuggestPass(ctx: PolicyContext): PolicyRuleEvaluation {
  if (ctx.action.type !== "SUGGEST_PRICE_CHANGE") {
    return { ruleCode: pricingSuggestPassRuleCode, result: "passed" };
  }
  return {
    ruleCode: pricingSuggestPassRuleCode,
    result: "passed",
    reason: "Price suggestion only — no ledger/listing mutation from this action type.",
  };
}
