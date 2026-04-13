import type { Prisma } from "@prisma/client";
import { isAiRankingEngineEnabled } from "@/src/modules/ranking/rankingEnv";
import {
  detectHighExposureLowCtr,
  detectLowTrustOrQualityScores,
} from "@/src/modules/ranking/feedbackEngine";
import type { ExecutiveRecommendationInput } from "@/src/modules/executive/recommendationEngine";

/**
 * Surfaces ranking evidence to the executive layer (no automatic rank mutation).
 */
export async function buildRankingExecutiveRecommendations(): Promise<ExecutiveRecommendationInput[]> {
  if (!isAiRankingEngineEnabled()) return [];

  const out: ExecutiveRecommendationInput[] = [];

  const [lowCtrBnhub, lowCtrRe, lowTrustB, lowTrustR] = await Promise.all([
    detectHighExposureLowCtr("bnhub", 14, 50),
    detectHighExposureLowCtr("real_estate", 14, 50),
    detectLowTrustOrQualityScores("bnhub", 25),
    detectLowTrustOrQualityScores("real_estate", 25),
  ]);

  const topBnhub = lowCtrBnhub[0];
  if (topBnhub) {
    out.push({
      recommendationType: "ranking",
      priorityScore: 72,
      title: `BNHUB listing ${topBnhub.listingId.slice(0, 8)}… high impressions, low CTR`,
      summary:
        "Search ranking telemetry shows strong exposure but weak click-through. Review cover photo, title, and price positioning before changing rank weights.",
      detailsJson: {
        source: "ranking_feedback",
        listingType: "bnhub",
        listingId: topBnhub.listingId,
        impressions: topBnhub.impressions,
        clicks: topBnhub.clicks,
        ctr: topBnhub.ctr,
      },
      evidenceJson: { sample: topBnhub } as Prisma.InputJsonValue,
      targetEntityType: "listing",
      targetEntityId: topBnhub.listingId,
    });
  }

  const topRe = lowCtrRe[0];
  if (topRe) {
    out.push({
      recommendationType: "ranking",
      priorityScore: 70,
      title: `FSBO listing ${topRe.listingId.slice(0, 8)}… high impressions, low CTR`,
      summary:
        "Buyer browse shows this listing is seen often but rarely clicked. Check hero image, headline, and trust badges.",
      detailsJson: {
        source: "ranking_feedback",
        listingType: "real_estate",
        listingId: topRe.listingId,
        impressions: topRe.impressions,
        clicks: topRe.clicks,
        ctr: topRe.ctr,
      },
      evidenceJson: { sample: topRe } as Prisma.InputJsonValue,
      targetEntityType: "listing",
      targetEntityId: topRe.listingId,
    });
  }

  const weakTrust = [...lowTrustB, ...lowTrustR][0];
  if (weakTrust) {
    out.push({
      recommendationType: "ranking",
      priorityScore: 58,
      title: `Low trust/quality ranking components for ${weakTrust.listingId.slice(0, 8)}…`,
      summary:
        "Persisted ranking breakdown shows weak trust or completeness vs peers. Verify verification, media, and disclosure completeness.",
      detailsJson: {
        source: "ranking_scores",
        listingId: weakTrust.listingId,
        listingType: weakTrust.listingType,
        trustScore: weakTrust.trustScore,
        qualityScore: weakTrust.qualityScore,
      },
      evidenceJson: weakTrust as unknown as Prisma.InputJsonValue,
      targetEntityType: "listing",
      targetEntityId: weakTrust.listingId,
    });
  }

  return out;
}
