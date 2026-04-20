import { getContextualStat } from "./contextual-stat.service";
import type { ContextFeatures } from "./context.types";

const FEATURE_WEIGHTS: Record<string, number> = {
  occupancyBucket: 0.2,
  adrBucket: 0.1,
  revparBucket: 0.1,
  bookingBucket: 0.1,
  revenueTrendBucket: 0.15,
  occupancyTrendBucket: 0.15,
  weekendBiasBucket: 0.05,
  seasonBucket: 0.05,
  priceTierBucket: 0.1,
};

function explorationBonus(successCount: number, failureCount: number) {
  const total = successCount + failureCount;
  if (total === 0) return 0.15;
  if (total < 3) return 0.08;
  return 0;
}

export async function computeContextualActionScore(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
  baseConfidence: number;
  baseRewardWeight: number;
  features: ContextFeatures;
}) {
  let contextualScore = 0;

  for (const [featureKey, featureBucket] of Object.entries(params.features)) {
    const stat = await getContextualStat({
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey: params.signalKey,
      actionType: params.actionType,
      featureKey,
      featureBucket,
    });

    const avgReward = Number(stat?.averageReward ?? 0);
    const successes = Number(stat?.successCount ?? 0);
    const failures = Number(stat?.failureCount ?? 0);
    const weight = FEATURE_WEIGHTS[featureKey] ?? 0;

    contextualScore += avgReward * weight;
    contextualScore += explorationBonus(successes, failures) * weight;
  }

  const finalScore =
    Number(params.baseConfidence ?? 0) * 0.35 +
    Number(params.baseRewardWeight ?? 1) * 0.25 +
    contextualScore * 0.4;

  return {
    finalScore: Math.round(finalScore * 10000) / 10000,
    contextualScore: Math.round(contextualScore * 10000) / 10000,
  };
}
