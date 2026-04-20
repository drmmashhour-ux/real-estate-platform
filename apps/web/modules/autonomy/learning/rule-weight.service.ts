import type { AutonomyRuleWeight } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canLearningUpdateRule } from "./learning-policy.service";

export async function getOrCreateRuleWeight(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
}) {
  const existing = await prisma.autonomyRuleWeight.findUnique({
    where: {
      scopeType_scopeId_domain_signalKey_actionType: {
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        domain: params.domain,
        signalKey: params.signalKey,
        actionType: params.actionType,
      },
    },
  });

  if (existing) return existing;

  return prisma.autonomyRuleWeight.create({
    data: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey: params.signalKey,
      actionType: params.actionType,
      weight: 1,
    },
  });
}

export async function updateRuleWeight(
  ruleWeightId: string,
  rewardScore: number
): Promise<{ applied: boolean; row: AutonomyRuleWeight }> {
  const row = await prisma.autonomyRuleWeight.findUnique({
    where: { id: ruleWeightId },
  });

  if (!row) throw new Error("Rule weight not found");

  const currentWeight = Number(row.weight ?? 1);

  const nSel = row.selectionCount ?? 0;
  const newAverageReward = (Number(row.averageReward ?? 0) * nSel + rewardScore) / (nSel + 1);

  if (!canLearningUpdateRule({ rewardScore, currentWeight })) {
    const held = await prisma.autonomyRuleWeight.update({
      where: { id: ruleWeightId },
      data: {
        averageReward: newAverageReward,
      },
    });
    await prisma.autonomyLearningLog.create({
      data: {
        scopeType: row.scopeType,
        scopeId: row.scopeId,
        ruleWeightId: row.id,
        eventType: "confidence_updated",
        message: "Rule weight update skipped by learning policy (bounds / reward audit).",
        meta: {
          rewardScore,
          currentWeight,
          bounded: true,
          averageReward: newAverageReward,
        },
      },
    });
    return { applied: false, row: held };
  }

  let nextWeight = currentWeight;

  if (rewardScore > 0.05) nextWeight += 0.05;
  else if (rewardScore < -0.05) nextWeight -= 0.05;

  nextWeight = Math.max(0.5, Math.min(1.5, nextWeight));

  const updated = await prisma.autonomyRuleWeight.update({
    where: { id: ruleWeightId },
    data: {
      weight: nextWeight,
      averageReward: newAverageReward,
      successCount: rewardScore > 0.05 ? row.successCount + 1 : row.successCount,
      failureCount: rewardScore < -0.05 ? row.failureCount + 1 : row.failureCount,
      totalReward: Number(row.totalReward ?? 0) + rewardScore,
      lastOutcomeAt: new Date(),
    },
  });

  return { applied: true, row: updated };
}
