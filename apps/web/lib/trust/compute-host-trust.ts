import type { PlatformTrustTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFraudTrustPenaltyPoints } from "@/lib/trust/fraud-trust-adjustment";
import { syncUserVerificationProfile } from "@/lib/trust/sync-verification-profile";
import { clampTrustScore, platformTrustTierFromScore } from "@/lib/trust/validators";

export type HostTrustComputeResult = {
  score: number;
  level: PlatformTrustTier;
  reasonsJson: Prisma.InputJsonValue;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Host trust uses the same user id as BNHub owner id (`PlatformTrustEntityType.host`). */
export async function computeHostTrustScore(hostUserId: string): Promise<HostTrustComputeResult> {
  await syncUserVerificationProfile(hostUserId);

  const [profile, hostProf, perf, badges, agg] = await Promise.all([
    prisma.userVerificationProfile.findUnique({ where: { userId: hostUserId } }),
    prisma.bnhubHostProfile.findUnique({ where: { userId: hostUserId } }),
    prisma.hostPerformance.findUnique({ where: { hostId: hostUserId } }),
    prisma.hostBadge.findMany({
      where: { hostId: hostUserId },
      select: { badgeType: true },
    }),
    prisma.propertyRatingAggregate.findMany({
      where: { listing: { ownerId: hostUserId } },
      select: { avgRating: true, totalReviews: true },
    }),
  ]);

  let raw = 28;
  const reasons: Record<string, number | string | boolean | string[]> = {};

  if (profile?.emailVerified) {
    raw += 10;
    reasons.email = true;
  }
  if (profile?.phoneVerified) {
    raw += 8;
    reasons.phone = true;
  }
  if (profile?.identityVerified) {
    raw += 12;
    reasons.identity = true;
  }
  if (profile?.paymentVerified) {
    raw += 10;
    reasons.payment = true;
  }

  if (hostProf?.verificationStatus === "verified") {
    raw += 8;
    reasons.bnhubHostVerification = true;
  }

  if (perf) {
    raw += clamp01(perf.score / 100) * 22;
    raw += clamp01(perf.responseRate) * 10;
    raw += clamp01(1 - Math.min(1, perf.cancellationRate * 3)) * 6;
    raw += clamp01(1 - Math.min(1, perf.disputeRate * 5)) * 8;
    reasons.hostPerformanceScore = perf.score;
  }

  const badgeTypes = badges.map((b) => b.badgeType);
  if (badgeTypes.includes("fast_responder")) raw += 5;
  if (badgeTypes.includes("reliable_host")) raw += 4;
  reasons.badges = badgeTypes;

  let revSum = 0;
  let revW = 0;
  for (const a of agg) {
    if (a.avgRating != null && (a.totalReviews ?? 0) > 0) {
      revSum += a.avgRating * Math.min(30, a.totalReviews ?? 0);
      revW += Math.min(30, a.totalReviews ?? 0);
    }
  }
  if (revW > 0) {
    const avg = revSum / revW;
    raw += clamp01((avg - 3) / 2) * 14;
    reasons.listingReviewBlend = avg;
  }

  const { penalty, reasons: fraudReasons } = await getFraudTrustPenaltyPoints("user", hostUserId);
  raw -= penalty;
  if (fraudReasons.length) reasons.fraud = fraudReasons;

  const score = clampTrustScore(raw);
  const level = platformTrustTierFromScore(score);
  return {
    score,
    level,
    reasonsJson: { reasons, penalty, engine: "platform_host_trust_v1" },
  };
}
