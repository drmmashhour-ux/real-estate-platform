import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import { GROWTH_V2 } from "../growth-v2.constants";
import { toScore100 } from "../growth.scoring";

/**
 * Surfaces high-performing FSBO inventory for newsletter / social *candidates* (no auto-send).
 */
export async function scanFeaturedAndCampaignCandidates(take = 50): Promise<{ rows: number }> {
  if (!engineFlags.growthAutopilotV1) return { rows: 0 };

  const top = await prisma.listingRankingScore.findMany({
    where: { listingType: RANKING_LISTING_TYPE_REAL_ESTATE },
    orderBy: { totalScore: "desc" },
    take,
    select: { listingId: true, totalScore: true, performanceBand: true },
  });

  const since = new Date(Date.now() - 7 * 86400000);
  let rows = 0;
  for (const r of top) {
    if ((r.totalScore ?? 0) < GROWTH_V2.MIN_RANKING_SCORE_FOR_NEWSLETTER_CANDIDATE) continue;
    const dup = await prisma.growthOpportunityCandidate.findFirst({
      where: {
        type: "email_newsletter_candidate",
        targetType: "fsbo_listing",
        targetId: r.listingId,
        createdAt: { gte: since },
      },
    });
    if (dup) continue;
    await prisma.growthOpportunityCandidate.create({
      data: {
        type: "email_newsletter_candidate",
        targetType: "fsbo_listing",
        targetId: r.listingId,
        score: toScore100(Math.min(1, (r.totalScore ?? 0) / 100)),
        reason: `Strong listing signal: composite rank ${Math.round(r.totalScore ?? 0)}/100 (${r.performanceBand ?? "n/a"} band) — editorial/newsletter candidate only.`,
        metadataJson: { band: r.performanceBand, source: "campaign_scan_v1", rankingScore: r.totalScore },
        status: "pending",
      },
    });
    rows++;
  }

  return { rows };
}
