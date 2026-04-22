/**
 * Quality guardrails — no spam rewards; compliance gates top placements.
 */
import type { BrokerLevelId } from "@/modules/gamification/broker-gamification.types";

/** Points cap per category per rolling day (anti-farming). */
export const DAILY_CATEGORY_CAPS: Partial<Record<string, number>> = {
  LEADS: 80,
  SPEED: 60,
};

/** Minimum normalized compliance/trust signal (0–1) to appear on featured leaderboards. */
export const LEADERBOARD_MIN_COMPLIANCE = 0.35;

/** Platinum / Elite effective points need this compliance floor. */
export const TOP_LEVEL_MIN_COMPLIANCE = 0.72;

/** Ignored-lead streak decay: reduces effective multiplier when overdue follow-ups pile up. */
export const IGNORED_LEAD_PENALTY_PER = 0.03;
export const MAX_IGNORED_PENALTY = 0.35;

export const POINT_VALUES = {
  onboardingComplete: 50,
  firstTransaction: 100,
  firstDocument: 35,
  signatureCompleted: 30,
  fastLeadResponse1h: 20,
  profileComplete: 25,
  dealClosedClean: 40,
  complianceBonus: 15,
  ignoredLeadPenalty: -25,
  overdueActionPenalty: -20,
  incompleteFilePenalty: -15,
} as const;

export function complianceQualityScore(args: {
  brokerStatus: string;
  verificationStatus?: string | null;
}): number {
  let q = 0.45;
  switch (args.brokerStatus) {
    case "VERIFIED":
      q = 0.92;
      break;
    case "PENDING":
      q = 0.62;
      break;
    case "NONE":
      q = 0.38;
      break;
    case "REJECTED":
      q = 0.08;
      break;
    default:
      break;
  }
  if (args.verificationStatus === "VERIFIED") q = Math.min(1, q + 0.05);
  return Math.max(0, Math.min(1, q));
}

export function effectivePointsMultiplier(complianceQuality: number, ignoredLeadApprox: number): number {
  const ignoredAdj = Math.min(MAX_IGNORED_PENALTY, ignoredLeadApprox * IGNORED_LEAD_PENALTY_PER);
  return Math.max(0.25, complianceQuality * (1 - ignoredAdj));
}

export function cumulativePointsToLevel(totalEffectivePoints: number, complianceQuality: number): BrokerLevelId {
  if (complianceQuality < LEADERBOARD_MIN_COMPLIANCE) return "STARTER";
  if (totalEffectivePoints < 120) return "STARTER";
  if (totalEffectivePoints < 350) return "ACTIVE";
  if (totalEffectivePoints < 900) return "PRO";
  if (totalEffectivePoints < 2200) {
    return complianceQuality >= TOP_LEVEL_MIN_COMPLIANCE ? "ELITE" : "PRO";
  }
  return complianceQuality >= TOP_LEVEL_MIN_COMPLIANCE ? "PLATINUM" : "ELITE";
}

export function leaderboardEligible(complianceQuality: number, normalizedScore: number): boolean {
  if (complianceQuality < LEADERBOARD_MIN_COMPLIANCE) return false;
  return normalizedScore > 0;
}

export function featuredPlacementEligible(level: BrokerLevelId, complianceQuality: number): boolean {
  return complianceQuality >= 0.78 && (level === "ELITE" || level === "PLATINUM");
}
