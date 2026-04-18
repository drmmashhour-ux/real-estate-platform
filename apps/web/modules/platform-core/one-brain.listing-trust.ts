import { prisma } from "@/lib/db";
import { platformCoreFlags } from "@/config/feature-flags";

/**
 * Aggregates stored One Brain trust scores for Platform Core decisions targeting a listing (0–1; 0 if none).
 */
export async function getAggregatedTrustScoreForListing(listingId: string): Promise<number> {
  if (!platformCoreFlags.platformCoreV1) return 0;

  const rows = await prisma.platformCoreDecision.findMany({
    where: { entityType: "LISTING", entityId: listingId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { metadata: true },
  });

  const scores: number[] = [];
  for (const r of rows) {
    const m = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null;
    const t = m?.trustScore;
    if (typeof t === "number" && Number.isFinite(t)) scores.push(Math.max(0, Math.min(1, t)));
  }

  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Average adaptive source weight multiplier stored on decisions for this listing (defaults to 1 when none).
 */
export async function getAggregatedSourceWeightForListing(listingId: string): Promise<number> {
  if (!platformCoreFlags.platformCoreV1) return 1;

  const rows = await prisma.platformCoreDecision.findMany({
    where: { entityType: "LISTING", entityId: listingId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { metadata: true },
  });

  const weights: number[] = [];
  for (const r of rows) {
    const m = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : null;
    const w = m?.sourceWeightApplied;
    if (typeof w === "number" && Number.isFinite(w)) weights.push(Math.max(0.5, Math.min(1.5, w)));
  }

  if (weights.length === 0) return 1;
  return weights.reduce((a, b) => a + b, 0) / weights.length;
}
