import { prisma } from "@repo/db";
import type { RecommendationMode } from "./recommendation.types";
import { RECOMMENDATION_TRACK_EVENTS, type RecommendationTrackEvent } from "./recommendation.types";

function isTrackEvent(k: string): k is RecommendationTrackEvent {
  return (RECOMMENDATION_TRACK_EVENTS as readonly string[]).includes(k);
}

export async function recordRecommendationEngagement(args: {
  userId: string;
  mode: RecommendationMode | string;
  eventKind: string;
  entityType?: string | null;
  entityId?: string | null;
  recommendationScore?: number | null;
  explanationUserSafe?: string | null;
  factorsJson?: Record<string, unknown> | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isTrackEvent(args.eventKind)) {
    return { ok: false, error: "invalid eventKind" };
  }

  await prisma.lecipmPersonalizedRecommendationEvent.create({
    data: {
      userId: args.userId,
      mode: args.mode,
      eventKind: args.eventKind,
      entityType: args.entityType ?? null,
      entityId: args.entityId ?? null,
      recommendationScore: args.recommendationScore ?? null,
      explanationUserSafe: args.explanationUserSafe ?? null,
      factorsJson: args.factorsJson ?? undefined,
      sessionId: args.sessionId ?? null,
      metadata: args.metadata ?? undefined,
    },
  });

  if (args.eventKind === "booked" || args.eventKind === "invested" || args.eventKind === "offered") {
    await prisma.evolutionOutcomeEvent.create({
      data: {
        domain: "recommendation",
        metricType: `rec_${args.eventKind}`.slice(0, 32),
        entityType: args.entityType ?? undefined,
        entityId: args.entityId ?? undefined,
        actualJson: {
          mode: args.mode,
          score: args.recommendationScore,
        },
      },
    });
  }

  return { ok: true };
}

export async function recommendationOutcomeRates(userId: string, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 86400000);
  const rows = await prisma.lecipmPersonalizedRecommendationEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { eventKind: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.eventKind] = (counts[r.eventKind] ?? 0) + 1;
  }
  const shown = counts["shown"] ?? 0;
  const clicked = counts["clicked"] ?? 0;
  return {
    counts,
    ctr: shown > 0 ? clicked / shown : null,
    windowDays: sinceDays,
  };
}
