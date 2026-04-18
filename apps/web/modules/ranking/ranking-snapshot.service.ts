/**
 * Optional persistence for explainable ranking outputs — append-only audit trail.
 * Call from admin/cron only; never required for public ranking reads.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reputationEngineFlags } from "@/config/feature-flags";
import type { UnifiedRankingExplanation } from "./ranking-factors.service";

export async function recordRankingSnapshotFromExplanation(
  listingId: string,
  explanation: UnifiedRankingExplanation,
): Promise<{ id: string } | null> {
  if (!reputationEngineFlags.reputationEngineV1) return null;

  const factors: Prisma.InputJsonValue = {
    listingQuality: explanation.factors.listingQuality,
    hostTrust: explanation.factors.hostTrust,
    reviewStrength: explanation.factors.reviewStrength,
    conversionStrength: explanation.factors.conversionStrength,
    freshness: explanation.factors.freshness,
    riskPenalty: explanation.factors.riskPenalty,
    pricingCompetitiveness: explanation.factors.pricingCompetitiveness,
    reasonsSample: explanation.reasons.slice(0, 12),
  };

  const row = await prisma.rankingSnapshot.create({
    data: {
      listingId,
      rankingScore: explanation.rankingScore,
      factors,
    },
    select: { id: true },
  });
  return row;
}
