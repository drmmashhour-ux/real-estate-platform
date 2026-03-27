import type { LeadScoreResult, LeadScoreSignals } from "../domain/leadScore";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function categoryFromScore(score: number): LeadScoreResult["category"] {
  if (score < 34) return "low";
  if (score < 67) return "medium";
  return "high";
}

/**
 * Deterministic lead score from product signals only (no LLM).
 */
export function scoreLeadFromSignals(signals: LeadScoreSignals): LeadScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const listingPts = Math.min(30, signals.listingCount * 5);
  score += listingPts;
  if (listingPts > 0) reasons.push(`Listings / inventory (${signals.listingCount})`);

  const copilotPts = Math.min(25, signals.copilotRunCount * 2);
  score += copilotPts;
  if (copilotPts > 0) reasons.push(`Copilot engagement (${signals.copilotRunCount} runs)`);

  const dealPts = Math.min(20, signals.dealAnalysisCount * 2);
  score += dealPts;
  if (dealPts > 0) reasons.push(`Deal Analyzer usage (${signals.dealAnalysisCount})`);

  const trustPts = Math.min(15, signals.verifiedListingCount * 5);
  score += trustPts;
  if (trustPts > 0) reasons.push(`Verified listings (${signals.verifiedListingCount})`);

  if (signals.hasActiveWorkspaceSubscription) {
    score += 25;
    reasons.push("Active LECIPM workspace subscription");
  }

  if (signals.daysSinceLastActivity != null && signals.daysSinceLastActivity > 14) {
    score -= 15;
    reasons.push(`Inactive ${signals.daysSinceLastActivity} days (penalty)`);
  }

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    category: categoryFromScore(score),
    reasons,
  };
}
