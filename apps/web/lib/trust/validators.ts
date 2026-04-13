import type { PlatformTrustTier, VerificationLevel } from "@prisma/client";

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export function clampTrustScore(n: number): number {
  if (!Number.isFinite(n)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(n)));
}

/** Rule bands: 0–29 low, 30–59 medium, 60–84 high, 85+ trusted */
export function platformTrustTierFromScore(score: number): PlatformTrustTier {
  const s = clampTrustScore(score);
  if (s < 30) return "low";
  if (s < 60) return "medium";
  if (s < 85) return "high";
  return "trusted";
}

export function verificationLevelFromFlags(flags: {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  brokerVerified: boolean;
  paymentVerified: boolean;
}): VerificationLevel {
  const n =
    Number(flags.emailVerified) +
    Number(flags.phoneVerified) +
    Number(flags.identityVerified) +
    Number(flags.brokerVerified) +
    Number(flags.paymentVerified);
  if (n >= 5) return "full";
  if (n >= 3) return "enhanced";
  return "basic";
}
