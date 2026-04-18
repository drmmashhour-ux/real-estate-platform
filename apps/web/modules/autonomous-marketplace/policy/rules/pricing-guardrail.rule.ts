import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const pricingGuardrailRuleCode = "pricing_guardrail";

export function evaluatePricingGuardrail(ctx: PolicyContext): PolicyRuleEvaluation {
  const meta = ctx.action.metadata as { deltaPct?: number; suggestDirection?: string };
  const delta = meta.deltaPct;
  if (ctx.action.type !== "APPLY_PRICE_CHANGE" && ctx.action.type !== "SUGGEST_PRICE_CHANGE") {
    return { ruleCode: pricingGuardrailRuleCode, result: "passed" };
  }

  if (ctx.action.type === "SUGGEST_PRICE_CHANGE") {
    return { ruleCode: pricingGuardrailRuleCode, result: "passed", reason: "Suggestions are advisory" };
  }

  if (delta == null || !Number.isFinite(delta)) {
    return {
      ruleCode: pricingGuardrailRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_WITH_APPROVAL",
      reason: "Price delta unknown — require approval before apply.",
    };
  }

  const maxUp = autonomyConfig.pricing.maxIncreasePctPerRun;
  const maxDown = autonomyConfig.pricing.maxDecreasePctPerRun;
  if (delta > maxUp || delta < -maxDown) {
    return {
      ruleCode: pricingGuardrailRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: `Delta ${delta.toFixed(2)}% exceeds per-run guardrail (+${maxUp}% / -${maxDown}%).`,
      metadata: { delta, maxUp, maxDown },
    };
  }

  if (Math.abs(ctx.priceDeltaTodayPct + delta) > autonomyConfig.pricing.maxIncreasePctPerDay + maxDown) {
    return {
      ruleCode: pricingGuardrailRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Cumulative daily price movement would exceed policy.",
    };
  }

  return { ruleCode: pricingGuardrailRuleCode, result: "passed" };
}
