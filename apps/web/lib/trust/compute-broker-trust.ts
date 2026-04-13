import type { PlatformTrustTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFraudTrustPenaltyPoints } from "@/lib/trust/fraud-trust-adjustment";
import { syncUserVerificationProfile } from "@/lib/trust/sync-verification-profile";
import { clampTrustScore, platformTrustTierFromScore } from "@/lib/trust/validators";

export type BrokerTrustComputeResult = {
  score: number;
  level: PlatformTrustTier;
  reasonsJson: Prisma.InputJsonValue;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Broker entity id = broker user id. */
export async function computeBrokerTrustScore(brokerUserId: string): Promise<BrokerTrustComputeResult> {
  await syncUserVerificationProfile(brokerUserId);

  const [profile, brokerRow, activity, leadStats] = await Promise.all([
    prisma.userVerificationProfile.findUnique({ where: { userId: brokerUserId } }),
    prisma.brokerVerification.findUnique({ where: { userId: brokerUserId } }),
    prisma.brokerActivityScore.findUnique({ where: { brokerId: brokerUserId } }),
    prisma.brokerLead.groupBy({
      by: ["status"],
      where: { brokerId: brokerUserId },
      _count: { _all: true },
    }),
  ]);

  let raw = 25;
  const reasons: Record<string, number | string | boolean> = {};

  if (profile?.brokerVerified || brokerRow?.verificationStatus === "VERIFIED") {
    raw += 28;
    reasons.licenseVerified = true;
  } else if (brokerRow?.verificationStatus === "PENDING") {
    raw += 6;
    reasons.licensePending = true;
  }

  if (profile?.emailVerified) {
    raw += 8;
    reasons.email = true;
  }
  if (profile?.phoneVerified) {
    raw += 8;
    reasons.phone = true;
  }
  if (profile?.identityVerified) {
    raw += 10;
    reasons.identity = true;
  }

  if (activity) {
    raw += clamp01(1 - Math.min(1, activity.riskScore / 120)) * 12;
    raw += clamp01(Math.min(1, activity.listingCount / 40)) * 6;
    reasons.brokerActivityRisk = activity.riskScore;
    reasons.brokerListingCount = activity.listingCount;
  }

  const totalLeads = leadStats.reduce((a, g) => a + g._count._all, 0);
  if (totalLeads > 0) {
    const closed = leadStats.find((g) => g.status === "closed")?._count._all ?? 0;
    raw += clamp01(closed / totalLeads) * 10;
    reasons.leadClosedRatio = closed / totalLeads;
  }

  const { penalty, reasons: fraudReasons } = await getFraudTrustPenaltyPoints("user", brokerUserId);
  raw -= penalty;
  if (fraudReasons.length) reasons.fraud = fraudReasons;

  const score = clampTrustScore(raw);
  const level = platformTrustTierFromScore(score);
  return {
    score,
    level,
    reasonsJson: { reasons, penalty, engine: "platform_broker_trust_v1" },
  };
}
