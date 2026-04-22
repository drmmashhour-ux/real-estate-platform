import { prisma } from "@/lib/db";

import type { GrowthLearningRowVm } from "./growth-engine.types";

/** Update rolling effectiveness when an outcome row records positive delta. */
export async function recordLearningUpdate(input: {
  signalCode: string;
  actionCode: string;
  reward: number;
}): Promise<void> {
  await prisma.lecipmGrowthEngineLearningStat.upsert({
    where: {
      signalCode_actionCode: {
        signalCode: input.signalCode,
        actionCode: input.actionCode,
      },
    },
    create: {
      signalCode: input.signalCode,
      actionCode: input.actionCode,
      attempts: 1,
      positiveOutcomes: input.reward > 0 ? 1 : 0,
      rollingScore: input.reward,
    },
    update: {
      attempts: { increment: 1 },
      positiveOutcomes: input.reward > 0 ? { increment: 1 } : undefined,
      rollingScore: input.reward,
    },
  });
}

export async function listTopLearningRows(take = 12): Promise<GrowthLearningRowVm[]> {
  const rows = await prisma.lecipmGrowthEngineLearningStat.findMany({
    orderBy: { rollingScore: "desc" },
    take,
  });
  return rows.map((r) => ({
    signalCode: r.signalCode,
    actionCode: r.actionCode,
    attempts: r.attempts,
    positiveOutcomes: r.positiveOutcomes,
    rollingScore: r.rollingScore,
  }));
}
