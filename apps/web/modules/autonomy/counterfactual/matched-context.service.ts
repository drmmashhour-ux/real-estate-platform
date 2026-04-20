import { prisma } from "@/lib/db";
import type { AutonomyAction } from "@prisma/client";
import { average, round4 } from "./counterfactual-math";

export async function estimateCounterfactualFromMatchedContext(action: Pick<
  AutonomyAction,
  "scopeType" | "scopeId" | "domain" | "signalKey" | "actionType" | "contextFeaturesJson"
>) {
  const contextFeatures =
    action.contextFeaturesJson &&
    typeof action.contextFeaturesJson === "object" &&
    !Array.isArray(action.contextFeaturesJson)
      ? (action.contextFeaturesJson as Record<string, string>)
      : {};
  const rewards: number[] = [];
  let matchedCount = 0;
  const matchLogs: Array<{ featureKey: string; featureValue: string; matchedCount: number; averageReward: number }> = [];

  const signalFilter = action.signalKey ?? undefined;

  for (const [featureKey, featureValue] of Object.entries(contextFeatures)) {
    const matches = await prisma.contextualActionStat.findMany({
      where: {
        scopeType: action.scopeType,
        scopeId: action.scopeId,
        domain: action.domain,
        ...(signalFilter ? { signalKey: signalFilter } : {}),
        actionType: action.actionType,
        featureKey,
        featureBucket: featureValue,
      },
    });

    const avgReward = average(matches.map((m) => Number(m.averageReward || 0)));
    matchedCount += matches.length;

    if (matches.length) rewards.push(avgReward);

    matchLogs.push({
      featureKey,
      featureValue,
      matchedCount: matches.length,
      averageReward: round4(avgReward),
    });
  }

  const matchedReward = round4(average(rewards));

  return {
    matchedReward,
    matchedCount,
    matchLogs,
  };
}
