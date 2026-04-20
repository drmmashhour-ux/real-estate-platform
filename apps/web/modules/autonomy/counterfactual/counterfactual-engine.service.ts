import type { AutonomyAction } from "@prisma/client";
import type { CounterfactualEvaluationResult } from "./counterfactual.types";
import { clamp, round4 } from "./counterfactual-math";
import { estimateCounterfactualFromTrend } from "./trend-projection.service";
import { estimateCounterfactualFromMatchedContext } from "./matched-context.service";
import { loadObservedCounterfactualMetrics } from "./observed-metrics.service";

export async function runCounterfactualEvaluation(action: AutonomyAction): Promise<{
  result: CounterfactualEvaluationResult;
  matchLogs: Array<{ featureKey: string; featureValue: string; matchedCount: number; averageReward: number }>;
}> {
  const observed = await loadObservedCounterfactualMetrics(action.scopeType, action.scopeId);
  const trendEstimate = await estimateCounterfactualFromTrend(action.scopeType, action.scopeId, 14);
  const matched = await estimateCounterfactualFromMatchedContext(action);

  let estimateMethod: CounterfactualEvaluationResult["estimateMethod"] = "trend_projection";

  let expected = {
    revenue: trendEstimate.revenue,
    occupancy: trendEstimate.occupancy,
    bookings: trendEstimate.bookings,
    adr: trendEstimate.adr,
    revpar: trendEstimate.revpar,
  };

  let confidenceScore = 0.45;

  if (matched.matchedCount > 0) {
    estimateMethod = "blended";
    confidenceScore = 0.65;

    const rewardFactor = matched.matchedReward;

    expected = {
      revenue: round4(trendEstimate.revenue * (1 + rewardFactor * 0.2)),
      occupancy: round4(trendEstimate.occupancy * (1 + rewardFactor * 0.1)),
      bookings: round4(trendEstimate.bookings * (1 + rewardFactor * 0.1)),
      adr: round4(trendEstimate.adr * (1 + rewardFactor * 0.1)),
      revpar: round4(trendEstimate.revpar * (1 + rewardFactor * 0.15)),
    };
  }

  const uplift = {
    revenue: round4(observed.revenue - expected.revenue),
    occupancy: round4(observed.occupancy - expected.occupancy),
    bookings: round4(observed.bookings - expected.bookings),
    adr: round4(observed.adr - expected.adr),
    revpar: round4(observed.revpar - expected.revpar),
  };

  let upliftScore =
    uplift.revenue * 0.3 +
    uplift.occupancy * 0.2 +
    uplift.bookings * 0.15 +
    uplift.adr * 0.1 +
    uplift.revpar * 0.25;

  upliftScore = round4(clamp(upliftScore, -1, 1));

  return {
    result: {
      observed,
      expected,
      uplift,
      upliftScore,
      confidenceScore,
      estimateMethod,
    },
    matchLogs: matched.matchLogs,
  };
}
