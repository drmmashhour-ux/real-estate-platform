import type { Prisma, ReputationEntityType, ReputationLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFraudReputationPenaltyPoints } from "@/lib/reputation/fraud-reputation-adjustment";
import { computeComplaintScoreComponent } from "@/lib/reputation/compute-complaint-score";
import { computeQualityScoreComponent } from "@/lib/reputation/compute-quality-score";
import { computeReliabilityScoreComponent } from "@/lib/reputation/compute-reliability-score";
import { computeResponsivenessScoreComponent } from "@/lib/reputation/compute-responsiveness-score";
import { computeReviewScoreComponent } from "@/lib/reputation/compute-review-score";
import { clampRepScore, reputationLevelFromScore } from "@/lib/reputation/validators";

const W = {
  review: 0.3,
  reliability: 0.25,
  responsiveness: 0.2,
  complaint: 0.15,
  quality: 0.1,
} as const;

export type ReputationComputeResult = {
  score: number;
  level: ReputationLevel;
  reviewScore: number;
  reliabilityScore: number;
  responsivenessScore: number;
  complaintScore: number;
  qualityScore: number;
  reasonsJson: Prisma.InputJsonValue;
};

export async function computeFullReputation(
  entityType: ReputationEntityType,
  entityId: string
): Promise<ReputationComputeResult> {
  const [rev, rel, resp, comp, qual] = await Promise.all([
    computeReviewScoreComponent(entityType, entityId),
    computeReliabilityScoreComponent(entityType, entityId),
    computeResponsivenessScoreComponent(entityType, entityId),
    computeComplaintScoreComponent(entityType, entityId),
    computeQualityScoreComponent(entityType, entityId),
  ]);

  let composite =
    rev.score * W.review +
    rel.score * W.reliability +
    resp.score * W.responsiveness +
    comp.score * W.complaint +
    qual.score * W.quality;

  const { penalty, reasons: fraudReasons } = await getFraudReputationPenaltyPoints(entityType, entityId);
  composite -= penalty;

  const trustKey = platformTrustLookupKey(entityType, entityId);
  const trustRow = trustKey
    ? await prisma.platformTrustScore.findUnique({
        where: { entityType_entityId: { entityType: trustKey.entityType, entityId: trustKey.entityId } },
        select: { score: true, level: true },
      })
    : null;
  let trustAdjust = 0;
  if (trustRow) {
    trustAdjust = (trustRow.score - 50) * 0.04;
    composite += trustAdjust;
  }

  const score = clampRepScore(composite);
  const level = reputationLevelFromScore(score);

  return {
    score,
    level,
    reviewScore: clampRepScore(rev.score),
    reliabilityScore: clampRepScore(rel.score),
    responsivenessScore: clampRepScore(resp.score),
    complaintScore: clampRepScore(comp.score),
    qualityScore: clampRepScore(qual.score),
    reasonsJson: {
      components: {
        review: rev.detail,
        reliability: rel.detail,
        responsiveness: resp.detail,
        complaint: comp.detail,
        quality: qual.detail,
      },
      weights: W,
      fraudPenalty: penalty,
      fraud: fraudReasons,
      trustAdjust,
      trustSnapshot: trustRow,
      engine: "platform_reputation_v1",
    } as Prisma.InputJsonValue,
  };
}

function platformTrustLookupKey(
  t: ReputationEntityType,
  entityId: string
): { entityType: "user" | "host" | "broker" | "listing"; entityId: string } | null {
  if (t === "listing") return { entityType: "listing", entityId };
  if (t === "host") return { entityType: "host", entityId };
  if (t === "broker") return { entityType: "broker", entityId };
  if (t === "seller" || t === "buyer") return { entityType: "user", entityId };
  return null;
}
