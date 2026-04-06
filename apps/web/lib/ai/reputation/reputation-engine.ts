import type { PrismaClient } from "@prisma/client";
import type { HostReputationResult, HostReputationTier } from "./reputation-types";
import type { RawHostReputationSignals } from "./reputation-signals";
import { loadHostReputationSignals } from "./reputation-signals";

/** Weighted blend (sum = 1.0 before dispute subtraction). */
export const W_RELIABILITY = 0.4;
export const W_RESPONSIVENESS = 0.2;
export const W_SATISFACTION = 0.2;
export const W_CONSISTENCY = 0.2;
/** Max points removed when dispute rate is high (bounded). */
export const DISPUTE_PENALTY_MAX = 28;

const MIN_TERMINAL_FOR_FULL_CONFIDENCE = 8;
const NEUTRAL_SUBSCORE = 56;

function clamp0100(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return NEUTRAL_SUBSCORE;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

function dampenForLimitedHistory(
  n: number,
  limited: boolean,
): number {
  if (!limited) return n;
  return clamp0100(NEUTRAL_SUBSCORE * 0.35 + n * 0.65);
}

/**
 * Reliability from completion vs host/guest cancellations (terminal set only).
 */
export function scoreReliability(raw: RawHostReputationSignals): number {
  const cancelPenalty = Math.min(1, raw.cancellationRate * 1.2);
  const base = raw.completionRate * 100 * (1 - 0.45 * cancelPenalty);
  return clamp0100(base);
}

/**
 * Responsiveness: response rate to first guest message + response time buckets.
 */
export function scoreResponsiveness(raw: RawHostReputationSignals): number {
  const ratePart = raw.responseRate * 100;
  let timePart = 85;
  if (raw.withGuestMessageCount === 0) {
    timePart = 72;
  } else if (raw.avgResponseTimeHours <= 0) {
    timePart = 78;
  } else if (raw.avgResponseTimeHours <= 2) {
    timePart = 100;
  } else if (raw.avgResponseTimeHours <= 8) {
    timePart = 88;
  } else if (raw.avgResponseTimeHours <= 24) {
    timePart = 72;
  } else if (raw.avgResponseTimeHours <= 72) {
    timePart = 58;
  } else {
    timePart = 45;
  }
  return clamp0100(ratePart * 0.55 + timePart * 0.45);
}

/**
 * Guest satisfaction from review averages when available; neutral band when thin.
 */
export function scoreGuestSatisfaction(raw: RawHostReputationSignals): number {
  if (raw.reviewWeightedAverage == null || raw.totalReviewCount <= 0) {
    return NEUTRAL_SUBSCORE;
  }
  const a = raw.reviewWeightedAverage;
  const mapped = ((a - 3) / 2) * 100 * 0.85 + 15;
  const volumeBoost = Math.min(8, Math.log10(1 + raw.totalReviewCount) * 4);
  return clamp0100(mapped + volumeBoost);
}

/**
 * Consistency: pre-arrival checklist on completed stays + repeat guest share.
 */
export function scoreConsistency(raw: RawHostReputationSignals): number {
  const checklistRate =
    raw.completedStaysCount <= 0
      ? 0.65
      : raw.checklistDeclaredOnCompletedCount / raw.completedStaysCount;
  const checklistPart = checklistRate * 100;
  const repeatPart = Math.min(100, 40 + raw.repeatGuestBookingShare * 120);
  return clamp0100(checklistPart * 0.55 + repeatPart * 0.45);
}

export function disputeSeverityScore(raw: RawHostReputationSignals): number {
  return clamp0100(Math.min(100, raw.disputeRate * 110 + raw.disputeCount * 3));
}

export function hostReputationTierLabel(tier: HostReputationTier): string {
  switch (tier) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "needs_improvement":
      return "Needs improvement";
    case "at_risk":
      return "At risk";
    default:
      return tier;
  }
}

export function classifyHostReputationTier(score: number): HostReputationTier {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "needs_improvement";
  return "at_risk";
}

export function buildHostReputationReasons(
  raw: RawHostReputationSignals,
  components: HostReputationResult["components"],
): string[] {
  const reasons: string[] = [];
  reasons.push(
    `Completion rate ${(raw.completionRate * 100).toFixed(1)}% on ${raw.terminalBookingCount} terminal booking(s).`,
  );
  reasons.push(`Cancellation share ${(raw.cancellationRate * 100).toFixed(1)}% (host + guest + declined).`);
  if (raw.withGuestMessageCount > 0) {
    reasons.push(
      `Responded to ${(raw.responseRate * 100).toFixed(0)}% of guest message threads; median response under ${raw.avgResponseTimeHours < 1 ? "1" : raw.avgResponseTimeHours < 24 ? Math.ceil(raw.avgResponseTimeHours).toString() : "24+"}h where measured.`,
    );
  } else {
    reasons.push("No guest-initiated inbox threads in the dataset — responsiveness scored conservatively.");
  }
  if (raw.totalReviewCount > 0 && raw.reviewWeightedAverage != null) {
    reasons.push(
      `Guest reviews averaged ${raw.reviewWeightedAverage.toFixed(2)} across ${raw.totalReviewCount} review(s).`,
    );
  } else {
    reasons.push("Limited or no published guest reviews yet — satisfaction uses a neutral band.");
  }
  reasons.push(
    `Checklist declared on ${raw.checklistDeclaredOnCompletedCount}/${raw.completedStaysCount} completed stay(s); repeat guest bookings ~${(raw.repeatGuestBookingShare * 100).toFixed(0)}% of trips.`,
  );
  reasons.push(`Disputes recorded: ${raw.disputeCount} (rate ${(raw.disputeRate * 100).toFixed(1)}%).`);
  reasons.push(
    `Component scores — reliability ${components.reliability.toFixed(0)}, responsiveness ${components.responsiveness.toFixed(0)}, satisfaction ${components.guestSatisfaction.toFixed(0)}, consistency ${components.consistency.toFixed(0)}.`,
  );
  return reasons;
}

export function hostReputationImprovementSuggestions(
  raw: RawHostReputationSignals,
  tier: HostReputationTier,
): string[] {
  const s: string[] = [];
  if (raw.cancellationRate > 0.12) {
    s.push("Review cancellation reasons and calendar accuracy to reduce avoidable cancellations.");
  }
  if (raw.responseRate < 0.85 && raw.withGuestMessageCount >= 3) {
    s.push("Reply to guest messages within a day when possible — responsiveness affects your score.");
  }
  if (raw.completedStaysCount > 0 && raw.checklistDeclaredOnCompletedCount / raw.completedStaysCount < 0.7) {
    s.push("Complete the pre-arrival checklist in the app for confirmed stays — it helps guests and your score.");
  }
  if (raw.disputeCount > 0) {
    s.push("Work with guests early when issues arise — open disputes reduce trust.");
  }
  if ((raw.totalReviewCount < 3 || raw.reviewWeightedAverage == null) && raw.completedStaysCount >= 2) {
    s.push("Encourage honest reviews after stays — more data improves score accuracy.");
  }
  if (tier === "at_risk" || tier === "needs_improvement") {
    s.push("Focus on reliable check-ins, accurate listing details, and clear house rules.");
  }
  if (s.length === 0) {
    s.push("Keep delivering consistent stays and timely messages to maintain your standing.");
  }
  return s.slice(0, 6);
}

/**
 * Pure scoring from loaded signals — bounded, explainable.
 */
export function computeHostReputation(raw: RawHostReputationSignals): HostReputationResult {
  const limitedHistory = raw.terminalBookingCount < MIN_TERMINAL_FOR_FULL_CONFIDENCE;

  let reliability = scoreReliability(raw);
  let responsiveness = scoreResponsiveness(raw);
  let guestSatisfaction = scoreGuestSatisfaction(raw);
  let consistency = scoreConsistency(raw);
  const disputeSeverity = disputeSeverityScore(raw);

  reliability = dampenForLimitedHistory(reliability, limitedHistory);
  responsiveness = dampenForLimitedHistory(responsiveness, limitedHistory);
  consistency = dampenForLimitedHistory(consistency, limitedHistory);

  const disputePenalty = Math.min(DISPUTE_PENALTY_MAX, raw.disputeRate * 85 + raw.disputeCount * 2.5);

  let score =
    W_RELIABILITY * reliability +
    W_RESPONSIVENESS * responsiveness +
    W_SATISFACTION * guestSatisfaction +
    W_CONSISTENCY * consistency -
    disputePenalty;

  score = clamp0100(score);
  const tier = classifyHostReputationTier(score);

  const components = {
    reliability,
    responsiveness,
    guestSatisfaction,
    consistency,
    disputeSeverity,
  };

  const signalsUsed: HostReputationResult["signalsUsed"] = {
    completion_rate: raw.completionRate,
    cancellation_rate: raw.cancellationRate,
    response_rate: raw.responseRate,
    response_time_hours: raw.avgResponseTimeHours,
    checklist_completion:
      raw.completedStaysCount > 0
        ? raw.checklistDeclaredOnCompletedCount / raw.completedStaysCount
        : null,
    dispute_count: raw.disputeCount,
    dispute_rate: raw.disputeRate,
    review_average: raw.reviewWeightedAverage,
    review_volume: raw.totalReviewCount,
    repeat_guest_share: raw.repeatGuestBookingShare,
  };

  const reasons = buildHostReputationReasons(raw, components);
  const improvementSuggestions = hostReputationImprovementSuggestions(raw, tier);

  return {
    hostId: raw.hostId,
    score,
    tier,
    reasons,
    signalsUsed,
    components,
    limitedHistory,
    improvementSuggestions,
  };
}

export async function getHostReputationForHost(
  db: PrismaClient,
  hostId: string,
): Promise<HostReputationResult> {
  const raw = await loadHostReputationSignals(db, hostId);
  return computeHostReputation(raw);
}

/** Marketplace: small multiplicative nudge — never drops to zero. */
export function hostReputationMarketplaceModifier(score0to100: number | null | undefined): number {
  if (score0to100 == null || !Number.isFinite(score0to100)) return 1;
  const s = Math.min(100, Math.max(0, score0to100));
  return Math.min(1.035, Math.max(0.965, 0.965 + (s / 100) * 0.07));
}

/** Decision engine: higher trust → slightly higher automation ceiling. */
export function reputationTrustFactorForAutomation(score0to100: number | null | undefined): number {
  if (score0to100 == null || !Number.isFinite(score0to100)) return 0.96;
  const s = Math.min(100, Math.max(0, score0to100));
  return Math.min(1.04, Math.max(0.82, 0.82 + (s / 100) * 0.22));
}

export function autopilotConfidenceMultiplierFromScore(score0to100: number | null | undefined): number {
  if (score0to100 == null || !Number.isFinite(score0to100)) return 0.96;
  const s = Math.min(100, Math.max(0, score0to100));
  if (s < 40) return 0.88;
  if (s < 60) return 0.94;
  if (s >= 80) return 1.02;
  return 1;
}

export function shouldPrioritizeHostSupport(score0to100: number | null | undefined): boolean {
  if (score0to100 == null || !Number.isFinite(score0to100)) return false;
  return score0to100 >= 40 && score0to100 < 65;
}
