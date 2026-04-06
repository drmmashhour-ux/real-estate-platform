import type { Prisma, PrismaClient } from "@prisma/client";
import type { BrainRecommendationDraft } from "./opportunity-detector";
import { applyLearningToDraft } from "./learning-weights";

export type OutcomeKind = "viewed" | "approved" | "rejected" | "executed" | "dismissed" | "ignored";

export { applyLearningToDraft };

/** Simple global outcome mix (last 30d) — bounded multiplier. */
export async function getLearningWeightMultiplier(prisma: PrismaClient): Promise<number> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  let good = 0;
  let bad = 0;
  try {
    [good, bad] = await Promise.all([
      prisma.growthBrainOutcomeEvent.count({
        where: { createdAt: { gte: since }, eventType: { in: ["executed", "approved"] } },
      }),
      prisma.growthBrainOutcomeEvent.count({
        where: { createdAt: { gte: since }, eventType: { in: ["dismissed", "rejected"] } },
      }),
    ]);
  } catch {
    good = 0;
    bad = 0;
  }

  if (good + bad === 0) return 1;
  const ratio = good / (good + bad);
  return 0.9 + Math.min(0.1, ratio * 0.1);
}

export async function applyLearningToDrafts(
  prisma: PrismaClient,
  drafts: BrainRecommendationDraft[]
): Promise<BrainRecommendationDraft[]> {
  const m = await getLearningWeightMultiplier(prisma);
  return drafts.map((d) => applyLearningToDraft(d, m));
}

export async function recordOutcome(
  prisma: PrismaClient,
  recommendationId: string,
  eventType: OutcomeKind,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.growthBrainOutcomeEvent.create({
    data: {
      recommendationId,
      eventType,
      metadataJson: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
