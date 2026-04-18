/**
 * Anti-abuse heuristics — conservative; financial rewards stay config-only upstream.
 */
export function evaluateReferralSuspicion(input: {
  ownerUserId: string;
  attributedUserId?: string | null;
  sameDeviceFingerprint?: string | null;
  lastReferralSeconds?: number | null;
}): { suspicionScore: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  if (input.attributedUserId && input.attributedUserId === input.ownerUserId) {
    score += 85;
    flags.push("self_referral");
  }
  if (input.sameDeviceFingerprint === "collision") {
    score += 40;
    flags.push("device_collision");
  }
  if (input.lastReferralSeconds != null && input.lastReferralSeconds < 120) {
    score += 25;
    flags.push("rapid_repeat");
  }
  return { suspicionScore: Math.min(100, score), flags };
}
