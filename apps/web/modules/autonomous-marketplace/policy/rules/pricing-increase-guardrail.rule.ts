import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";
import { evaluateDailyPriceMovementCap } from "./pricing-limits.shared";

export const pricingIncreaseGuardrailRuleCode = "pricing_increase_guardrail";

/** Caps upward APPLY_PRICE_CHANGE deltas per run/day (LECIPM monetization guardrail). */
export function evaluatePricingIncreaseGuardrail(ctx: PolicyContext): PolicyRuleEvaluation {
  const meta = ctx.action.metadata as { deltaPct?: number };
  const delta = meta.deltaPct;

  if (ctx.action.type !== "APPLY_PRICE_CHANGE") {
    return { ruleCode: pricingIncreaseGuardrailRuleCode, result: "passed" };
  }

  if (delta == null || !Number.isFinite(delta) || delta <= 0) {
    return { ruleCode: pricingIncreaseGuardrailRuleCode, result: "passed" };
  }

  if (delta > autonomyConfig.pricing.maxIncreasePctPerRun) {
    return {
      ruleCode: pricingIncreaseGuardrailRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: `Increase ${delta.toFixed(2)}% exceeds max +${autonomyConfig.pricing.maxIncreasePctPerRun}% per run.`,
      metadata: { delta },
    };
  }

  const daily = evaluateDailyPriceMovementCap(ctx, delta, pricingIncreaseGuardrailRuleCode);
  if (daily) return daily;

  return { ruleCode: pricingIncreaseGuardrailRuleCode, result: "passed" };
}
