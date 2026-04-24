import type { LecipmTrustOperationalBand } from "@prisma/client";

import { logTrustRanking } from "./trust-score-log";
import type { RankingModifier } from "./trust-score.types";

/**
 * Bounded ranking influence — trust is one signal among many; keeps suppression policy reviewable.
 * @param policyGateMajorSuppression — when true, zero-out negative lifts for listing ordering (placeholder for DB flag).
 */
export function operationalTrustRankingModifier(
  trustScore: number,
  band: LecipmTrustOperationalBand,
  policyGateMajorSuppression = true,
): RankingModifier {
  /** Normalized [-1, 1] roughly */
  const strength = (trustScore - 50) / 50;

  let sortLift = clamp(strength * 0.06, -0.06, 0.06);
  let prominenceLift = clamp(strength * 0.05, -0.05, 0.05);
  let queuePriorityLift = clamp(strength * 0.08, -0.08, 0.08);

  if (band === "CRITICAL_REVIEW" || band === "ELEVATED_RISK") {
    queuePriorityLift = Math.max(queuePriorityLift, 0.04);
  }

  if (policyGateMajorSuppression && band === "CRITICAL_REVIEW") {
    sortLift = clamp(sortLift, -0.02, 0.02);
    prominenceLift = clamp(prominenceLift, -0.02, 0.02);
  }

  const note =
    "Ranking modifiers are intentionally small in v1; combine with relevance, freshness, fees, and policy flags.";

  logTrustRanking("modifier_applied", {
    trustScore,
    band,
    sortLift,
    prominenceLift,
    queuePriorityLift,
    suppressionGuard: policyGateMajorSuppression,
  });

  return { sortLift, prominenceLift, queuePriorityLift, note };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
