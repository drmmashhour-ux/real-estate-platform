import { prisma } from "@/lib/db";
import { getOrCreateContextualStat } from "./contextual-stat.service";

export async function updateContextualStatsFromOutcome(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
  contextFeatures: Record<string, string>;
  rewardScore: number;
}) {
  for (const [featureKey, featureBucket] of Object.entries(params.contextFeatures ?? {})) {
    const stat = await getOrCreateContextualStat({
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey: params.signalKey,
      actionType: params.actionType,
      featureKey,
      featureBucket,
    });

    const totalSamples = Number(stat.successCount ?? 0) + Number(stat.failureCount ?? 0);
    const nextAverage =
      (Number(stat.averageReward ?? 0) * totalSamples + params.rewardScore) / (totalSamples + 1);

    await prisma.contextualActionStat.update({
      where: { id: stat.id },
      data: {
        averageReward: Math.round(nextAverage * 10000) / 10000,
        totalReward: Number(stat.totalReward ?? 0) + params.rewardScore,
        successCount:
          params.rewardScore > 0.05 ? Number(stat.successCount ?? 0) + 1 : Number(stat.successCount ?? 0),
        failureCount:
          params.rewardScore < -0.05 ? Number(stat.failureCount ?? 0) + 1 : Number(stat.failureCount ?? 0),
      },
    });
  }
}
