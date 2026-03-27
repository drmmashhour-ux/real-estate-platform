import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateBookingDepositRecommendationRule(ctx: { totalCents: number }): RuleEvaluationResult {
  const at = getPhase5GrowthConfig().bnhubBooking.depositRecommendAboveCents;
  const recommend = ctx.totalCents >= at;
  return {
    ruleCode: "BOOKING_DEPOSIT_RECOMMENDATION_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: !recommend,
    scoreDelta: recommend ? -3 : 0,
    confidence: 1,
    details: { totalCents: ctx.totalCents, depositRecommended: recommend, thresholdCents: at },
  };
}
