import type { PlatformTrustTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFraudTrustPenaltyPoints } from "@/lib/trust/fraud-trust-adjustment";
import { syncUserVerificationProfile } from "@/lib/trust/sync-verification-profile";
import { clampTrustScore, platformTrustTierFromScore } from "@/lib/trust/validators";

export type UserTrustComputeResult = {
  score: number;
  level: PlatformTrustTier;
  reasonsJson: Prisma.InputJsonValue;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Rule-based user trust (0–100): verification + profile completeness + BNHub guest signals.
 */
export async function computeUserTrustScore(userId: string): Promise<UserTrustComputeResult> {
  await syncUserVerificationProfile(userId);

  const [profile, user, perf] = await Promise.all([
    prisma.userVerificationProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        phone: true,
        bnhubGuestTrustScore: true,
        bnhubGuestTotalStays: true,
        bnhubGuestRatingAverage: true,
      },
    }),
    prisma.hostPerformance.findUnique({ where: { hostId: userId } }),
  ]);

  let raw = 22;
  const reasons: Record<string, number | string | boolean> = {};

  if (profile?.emailVerified) {
    raw += 14;
    reasons.email = true;
  }
  if (profile?.phoneVerified) {
    raw += 12;
    reasons.phone = true;
  }
  if (profile?.identityVerified) {
    raw += 16;
    reasons.identity = true;
  }
  if (profile?.brokerVerified) {
    raw += 10;
    reasons.broker = true;
  }
  if (profile?.paymentVerified) {
    raw += 8;
    reasons.payment = true;
  }

  const profileComplete = Boolean(user?.name?.trim() && (user.phone?.trim() || profile?.emailVerified));
  if (profileComplete) {
    raw += 6;
    reasons.profileComplete = true;
  }

  if (user) {
    const g = clamp01(user.bnhubGuestTrustScore / 100);
    raw += g * 12;
    reasons.bnhubGuestTrust = user.bnhubGuestTrustScore;
    const stays = Math.min(20, user.bnhubGuestTotalStays ?? 0);
    raw += (stays / 20) * 8;
    if (user.bnhubGuestRatingAverage != null) {
      raw += clamp01((user.bnhubGuestRatingAverage - 3) / 2) * 8;
      reasons.guestRatingAvg = user.bnhubGuestRatingAverage;
    }
  }

  if (perf) {
    const resp = clamp01(perf.responseRate);
    const disp = clamp01(1 - Math.min(1, perf.disputeRate * 4));
    raw += (resp * 6 + disp * 6) * 0.5;
    reasons.hostResponseRate = perf.responseRate;
    reasons.hostDisputeRate = perf.disputeRate;
  }

  const { penalty, reasons: fraudReasons } = await getFraudTrustPenaltyPoints("user", userId);
  raw -= penalty;
  if (fraudReasons.length) reasons.fraud = fraudReasons;

  const score = clampTrustScore(raw);
  const level = platformTrustTierFromScore(score);
  return {
    score,
    level,
    reasonsJson: { reasons, penalty, engine: "platform_user_trust_v1" },
  };
}
