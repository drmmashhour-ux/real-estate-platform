import { NextResponse } from "next/server";
import { engineFlags, reputationEngineFlags } from "@/config/feature-flags";
import { prisma } from "@repo/db";
import { requireUser } from "@/modules/security/access-guard.service";
import { computeReputationRankingForListing } from "@/modules/ranking/ranking-engine.service";

export const dynamic = "force-dynamic";

export type PublicRankingInsightRow = {
  listingId: string;
  title: string;
  rankingScore: number;
  factors: {
    listingQuality: number;
    hostTrust: number;
    reviewStrength: number;
    conversionStrength: number;
    freshness: number;
    riskPenalty: number;
    pricingCompetitiveness: number;
  };
  /** Explainable strings only — no raw fraud labels or internal bundle payloads. */
  reasons: string[];
};

/**
 * GET — BNHub listings you host: unified ranking score + factor grid (reputation + ranking flags).
 * Additive; does not change search ordering.
 */
export async function GET() {
  if (!engineFlags.marketingIntelligenceV1 || !reputationEngineFlags.rankingEngineV1) {
    return NextResponse.json({ error: "Ranking insights are disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: auth.userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const rows: PublicRankingInsightRow[] = [];
  for (const l of listings) {
    const expl = await computeReputationRankingForListing(l.id);
    if (!expl) continue;
    rows.push({
      listingId: l.id,
      title: l.title,
      rankingScore: expl.rankingScore,
      factors: expl.factors,
      reasons: expl.reasons.slice(0, 8),
    });
  }

  return NextResponse.json({
    windowNote: "Scores blend BNHub ranking bundle with listing quality, host trust, and reviews — see reasons[] per listing.",
    listings: rows,
  });
}
