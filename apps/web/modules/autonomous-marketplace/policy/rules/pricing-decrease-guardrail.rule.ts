import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";
import { evaluateDailyPriceMovementCap } from "./pricing-limits.shared";

export const pricingDecreaseGuardrailRuleCode = "pricing_decrease_guardrail";

/** Caps downward APPLY_PRICE_CHANGE deltas per run/day. */
export function evaluatePricingDecreaseGuardrail(ctx: PolicyContext): PolicyRuleEvaluation {
  const meta = ctx.action.metadata as { deltaPct?: number };
  const delta = meta.deltaPct;

  if (ctx.action.type !== "APPLY_PRICE_CHANGE") {
    return { ruleCode: pricingDecreaseGuardrailRuleCode, result: "passed" };
  }

  if (delta == null || !Number.isFinite(delta) || delta >= 0) {
    return { ruleCode: pricingDecreaseGuardrailRuleCode, result: "passed" };
  }

  const absDec = Math.abs(delta);
  if (absDec > autonomyConfig.pricing.maxDecreasePctPerRun) {
    return {
      ruleCode: pricingDecreaseGuardrailRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: `Decrease ${absDec.toFixed(2)}% exceeds max ${autonomyConfig.pricing.maxDecreasePctPerRun}% per run.`,
      metadata: { delta },
    };
  }

  const daily = evaluateDailyPriceMovementCap(ctx, delta, pricingDecreaseGuardrailRuleCode);
  if (daily) return daily;

  return { ruleCode: pricingDecreaseGuardrailRuleCode, result: "passed" };
}
