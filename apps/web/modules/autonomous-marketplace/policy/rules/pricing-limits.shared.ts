import { autonomyConfig } from "../../config/autonomy.config";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export function evaluateDailyPriceMovementCap(
  ctx: PolicyContext,
  delta: number,
  ruleCode: string,
): PolicyRuleEvaluation | null {
  const maxUp = autonomyConfig.pricing.maxIncreasePctPerRun;
  const maxDown = autonomyConfig.pricing.maxDecreasePctPerRun;
  if (Math.abs(ctx.priceDeltaTodayPct + delta) > autonomyConfig.pricing.maxIncreasePctPerDay + maxDown) {
    return {
      ruleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason: "Cumulative daily price movement would exceed policy.",
      metadata: { delta, priceDeltaTodayPct: ctx.priceDeltaTodayPct },
    };
  }
  return null;
}
