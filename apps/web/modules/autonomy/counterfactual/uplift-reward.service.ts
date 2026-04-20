import { prisma } from "@/lib/db";
import { round4, clamp } from "./counterfactual-math";

export async function applyUpliftAdjustedReward(actionId: string) {
  const outcome = await prisma.autonomyOutcome.findUnique({
    where: { actionId },
  });

  const cf = await prisma.counterfactualEvaluation.findUnique({
    where: { actionId },
  });

  if (!outcome || !cf) {
    throw new Error("Outcome or counterfactual evaluation missing");
  }

  const rawReward = Number(outcome.rewardScore || 0);
  const upliftScore = Number(cf.upliftScore || 0);
  const confidence = Number(cf.confidenceScore || 0.4);

  const expectedRewardScore = round4(rawReward - upliftScore);
  const upliftAdjustedReward = round4(clamp(rawReward * 0.5 + upliftScore * confidence * 0.5, -1, 1));

  const updated = await prisma.autonomyOutcome.update({
    where: { actionId },
    data: {
      expectedRewardScore,
      upliftAdjustedReward,
      counterfactualEvalId: cf.id,
    },
  });

  await prisma.upliftLearningLog.create({
    data: {
      actionId,
      scopeType: outcome.scopeType,
      scopeId: outcome.scopeId,
      eventType: "uplift_applied",
      message: "Uplift-adjusted reward stored (estimate-based; not proven incremental causality).",
      meta: {
        rawReward,
        upliftScore,
        confidence,
        expectedRewardScore,
        upliftAdjustedReward,
      },
    },
  });

  return updated;
}
