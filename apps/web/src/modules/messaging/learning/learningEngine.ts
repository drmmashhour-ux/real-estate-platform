import { prisma } from "@/lib/db";
import type { LearningRoutingContext } from "@/src/modules/messaging/learning/contextKey";
import { normDim } from "@/src/modules/messaging/learning/contextKey";
import { templateMinSampleSize } from "@/src/modules/messaging/learning/learningEnv";
import { derivedRates, weightedScore } from "@/src/modules/messaging/learning/templatePerformance";

export type TemplateRankingRow = {
  templateKey: string;
  sentCount: number;
  score: number;
  replyRate: number;
  qualifiedRate: number;
  bookedRate: number;
  staleRate: number;
  handoffRate: number;
};

export async function getTemplateRankingForContext(
  ctx: LearningRoutingContext,
  minSent = templateMinSampleSize()
): Promise<TemplateRankingRow[]> {
  const rows = await prisma.growthAiTemplatePerformance.findMany({
    where: {
      stage: normDim(ctx.stage),
      detectedIntent: normDim(ctx.detectedIntent),
      detectedObjection: normDim(ctx.detectedObjection),
      highIntent: ctx.highIntent,
      sentCount: { gte: minSent },
    },
  });

  return rows
    .map((r) => {
      const rates = derivedRates(r);
      return {
        templateKey: r.templateKey,
        sentCount: r.sentCount,
        score: weightedScore(r),
        ...rates,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export async function getBestTemplateForContext(
  ctx: LearningRoutingContext,
  minSent = templateMinSampleSize()
): Promise<string | null> {
  const ranked = await getTemplateRankingForContext(ctx, minSent);
  return ranked[0]?.templateKey ?? null;
}

export type LearningRecommendation = {
  recommendedTemplateKey: string | null;
  defaultTemplateKey: string;
  reason: string;
  ranking: TemplateRankingRow[];
};

export async function getLearningRecommendation(
  ctx: LearningRoutingContext,
  defaultTemplateKey: string
): Promise<LearningRecommendation> {
  const ranking = await getTemplateRankingForContext(ctx, templateMinSampleSize());
  const best = ranking[0];
  const defRow = ranking.find((r) => r.templateKey === defaultTemplateKey);
  if (!best) {
    return {
      recommendedTemplateKey: null,
      defaultTemplateKey,
      reason: "insufficient_samples",
      ranking,
    };
  }
  if (best.templateKey === defaultTemplateKey) {
    return {
      recommendedTemplateKey: defaultTemplateKey,
      defaultTemplateKey,
      reason: "default_is_best",
      ranking,
    };
  }
  const defScore = defRow?.score ?? -99;
  const delta = best.score - defScore;
  if (delta < 0.12) {
    return {
      recommendedTemplateKey: null,
      defaultTemplateKey,
      reason: "no_clear_winner",
      ranking,
    };
  }
  return {
    recommendedTemplateKey: best.templateKey,
    defaultTemplateKey,
    reason: "learner_prefers_alternative",
    ranking,
  };
}

