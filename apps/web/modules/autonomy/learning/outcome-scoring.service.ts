import type { BaselineMetrics, OutcomeEvaluation, OutcomeMetrics } from "./learning.types";
import { clamp, percentChange, round4 } from "./learning-math";

export function evaluateOutcome(
  actionDomain: string,
  actionType: string,
  baseline: BaselineMetrics,
  observed: OutcomeMetrics
): OutcomeEvaluation {
  const revenueDelta = round4(percentChange(observed.grossRevenue, baseline.grossRevenue));
  const occupancyDelta = round4(percentChange(observed.occupancyRate, baseline.occupancyRate));
  const bookingDelta = round4(percentChange(observed.bookingCount, baseline.bookingCount));
  const adrDelta = round4(percentChange(observed.adr, baseline.adr));
  const revparDelta = round4(percentChange(observed.revpar, baseline.revpar));

  let rewardScore = 0;

  if (actionDomain === "pricing") {
    if (actionType === "price_decrease") {
      rewardScore += occupancyDelta * 0.35;
      rewardScore += bookingDelta * 0.25;
      rewardScore += revenueDelta * 0.25;
      rewardScore += revparDelta * 0.15;
    } else if (actionType === "price_increase") {
      rewardScore += revenueDelta * 0.35;
      rewardScore += adrDelta * 0.25;
      rewardScore += revparDelta * 0.25;
      rewardScore += occupancyDelta * 0.15;
    }
  }

  if (actionDomain === "promotions") {
    rewardScore += bookingDelta * 0.35;
    rewardScore += occupancyDelta * 0.3;
    rewardScore += revenueDelta * 0.2;
    rewardScore += revparDelta * 0.15;
  }

  if (actionDomain === "listing") {
    rewardScore += bookingDelta * 0.3;
    rewardScore += occupancyDelta * 0.25;
    rewardScore += revenueDelta * 0.25;
    rewardScore += revparDelta * 0.2;
  }

  rewardScore = round4(clamp(rewardScore, -1, 1));

  let outcomeLabel: "positive" | "neutral" | "negative" = "neutral";
  if (rewardScore > 0.05) outcomeLabel = "positive";
  if (rewardScore < -0.05) outcomeLabel = "negative";

  return {
    rewardScore,
    outcomeLabel,
    deltas: {
      revenueDelta,
      occupancyDelta,
      bookingDelta,
      adrDelta,
      revparDelta,
    },
  };
}
