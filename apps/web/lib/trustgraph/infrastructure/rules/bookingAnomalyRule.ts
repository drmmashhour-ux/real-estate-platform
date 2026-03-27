import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

/** Deterministic short-notice signal only — no speculative fraud. */
export function evaluateBookingAnomalyRule(ctx: { createdAt: Date; checkIn: Date }): RuleEvaluationResult {
  const hours = (ctx.checkIn.getTime() - ctx.createdAt.getTime()) / 3600000;
  const threshold = getPhase5GrowthConfig().bnhubBooking.shortNoticeHours;
  const shortNotice = hours > 0 && hours < threshold;
  return {
    ruleCode: "BOOKING_ANOMALY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: !shortNotice,
    scoreDelta: shortNotice ? -5 : 2,
    confidence: 1,
    details: { hoursToCheckIn: Math.round(hours * 10) / 10, shortNotice, thresholdHours: threshold },
  };
}
