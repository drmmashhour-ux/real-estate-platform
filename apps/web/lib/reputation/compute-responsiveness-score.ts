import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampRepScore } from "@/lib/reputation/validators";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export async function computeResponsivenessScoreComponent(
  entityType: ReputationEntityType,
  entityId: string
): Promise<{ score: number; detail: Record<string, unknown> }> {
  if (entityType === "listing") {
    const owner = await prisma.shortTermListing.findUnique({
      where: { id: entityId },
      select: { ownerId: true },
    });
    if (!owner) return { score: 50, detail: { error: "listing_not_found" } };
    return computeResponsivenessScoreComponent("host", owner.ownerId);
  }

  if (entityType === "buyer") {
    return { score: 58, detail: { source: "buyer_guest_neutral" } };
  }

  if (entityType === "host" || entityType === "broker" || entityType === "seller") {
    const [hq, perf] = await Promise.all([
      prisma.hostQuality.findUnique({ where: { userId: entityId } }),
      prisma.hostPerformance.findUnique({ where: { hostId: entityId } }),
    ]);
    let score = entityType === "broker" && !hq && !perf ? 52 : 55;
    const detail: Record<string, unknown> = {};

    if (hq?.avgResponseMinutes != null && hq.avgResponseMinutes > 0) {
      const mins = hq.avgResponseMinutes;
      const fast = mins <= 60 ? 1 : mins <= 240 ? 0.85 : mins <= 720 ? 0.65 : 0.45;
      score = clampRepScore(42 + fast * 55);
      detail.avgResponseMinutes = mins;
    }
    if (perf?.responseRate != null) {
      score = clampRepScore((score + clamp01(perf.responseRate) * 100) / 2);
      detail.responseRate = perf.responseRate;
    }

    await prisma.reputationResponseMetric.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: {
        entityType,
        entityId,
        avgResponseMinutes: hq?.avgResponseMinutes != null ? Math.round(hq.avgResponseMinutes) : null,
        replyRate: perf?.responseRate ?? null,
      },
      update: {
        avgResponseMinutes: hq?.avgResponseMinutes != null ? Math.round(hq.avgResponseMinutes) : null,
        replyRate: perf?.responseRate ?? null,
      },
    });

    return { score, detail };
  }

  return { score: 52, detail: {} };
}
