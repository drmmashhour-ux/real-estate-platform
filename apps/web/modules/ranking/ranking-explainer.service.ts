import type { UnifiedRankingExplanation } from "./ranking-factors.service";

export type PublicTrustIndicators = {
  labels: string[];
  /** Safe for listing cards — no fraud internals. */
  subtitle?: string;
};

/**
 * Strips sensitive wording for guest-facing surfaces — ops can still use full `reasons` internally.
 */
export function toPublicTrustIndicators(explanation: UnifiedRankingExplanation): PublicTrustIndicators {
  const labels: string[] = [];
  const f = explanation.factors;

  if (f.hostTrust >= 72) labels.push("Responsive host");
  else if (f.hostTrust >= 55) labels.push("Established host");

  if (f.listingQuality >= 72) labels.push("Strong listing quality");
  else if (f.listingQuality >= 55) labels.push("Good listing detail");

  if (f.reviewStrength >= 65) labels.push("Strong guest ratings");
  else if (f.reviewStrength >= 45) labels.push("Growing reviews");

  if (f.riskPenalty >= 25) labels.push("Extra verification in progress");

  const subtitle =
    labels.length > 0
      ? "Signals combine reviews, host reliability, and listing completeness — never pay-to-win alone."
      : undefined;

  return { labels: labels.slice(0, 4), subtitle };
}
