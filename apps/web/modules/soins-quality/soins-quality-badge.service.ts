import type {
  SoinsQualityBadgeLevel,
  SoinsQualityBadgeResult,
  SoinsQualityComputed,
  SoinsQualitySignals,
} from "./soins-quality.types";

/** Minimum aggregate score to qualify for tier if no badge blockers apply. */
export const BADGE_ELITE_MIN_OVERALL = 88;
export const BADGE_PREMIUM_MIN_OVERALL = 73;

/**
 * Badge rules:
 * - ELITE requires high overall score and zero critical unresolved operational flags.
 * - Critical flags force STANDARD regardless of numeric score (safety/consistency).
 * - PREMIUM sits between STANDARD and ELITE thresholds.
 */
export function assignSoinsBadge(
  computed: Pick<SoinsQualityComputed, "overallScore">,
  signals: Pick<SoinsQualitySignals, "criticalUnresolvedOperationalIssues">,
): SoinsQualityBadgeResult {
  const reasons: string[] = [];
  const score = computed.overallScore;

  if (signals.criticalUnresolvedOperationalIssues) {
    reasons.push(
      "Operational quality tier capped at STANDARD while critical unresolved operational items remain open.",
    );
    return { badgeLevel: "STANDARD", reasons };
  }

  if (score >= BADGE_ELITE_MIN_OVERALL) {
    reasons.push(`Overall score ${score.toFixed(1)} meets ELITE threshold (${BADGE_ELITE_MIN_OVERALL}+).`);
    reasons.push("No critical unresolved operational flags recorded in-window.");
    return { badgeLevel: "ELITE", reasons };
  }

  if (score >= BADGE_PREMIUM_MIN_OVERALL) {
    reasons.push(`Overall score ${score.toFixed(1)} meets PREMIUM threshold (${BADGE_PREMIUM_MIN_OVERALL}+).`);
    return { badgeLevel: "PREMIUM", reasons };
  }

  reasons.push(`Overall score ${score.toFixed(1)} maps to STANDARD tier under current thresholds.`);
  return { badgeLevel: "STANDARD", reasons };
}

/** Map badge to short UI label — never implies clinical accreditation. */
export function badgeMarketingLabel(level: SoinsQualityBadgeLevel): string {
  switch (level) {
    case "ELITE":
      return "Elite operations (platform)";
    case "PREMIUM":
      return "Premium operations (platform)";
    default:
      return "Standard listing (platform)";
  }
}
