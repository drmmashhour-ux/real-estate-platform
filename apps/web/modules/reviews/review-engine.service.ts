import { aggregateListingReviews } from "./review-aggregator.service";
import { analyzeListingReviewIntegrity } from "./review-integrity.service";

export type ReviewEngineOutput = {
  averageScore: number | null;
  reviewCount: number;
  integrityStatus: string;
  suspiciousPatterns: string[];
  /** Human-readable integrity notes — does not modify stored reviews. */
  reasons: string[];
};

function patternsToReasons(patterns: string[]): string[] {
  const reasons: string[] = [];
  for (const p of patterns) {
    if (p.startsWith("many_reviews_same_guest:")) {
      reasons.push("Multiple reviews from the same guest account — moderation may review weighting.");
    } else if (p.startsWith("elevated_spam_scores:")) {
      reasons.push("Some reviews have elevated automated spam scores.");
    } else if (p === "high_moderation_hold_rate") {
      reasons.push("A high share of reviews were held for moderation.");
    } else if (p === "uniform_star_rating_pattern") {
      reasons.push("Unusually uniform star ratings across recent reviews.");
    } else {
      reasons.push("Additional integrity checks flagged this listing’s review set for review.");
    }
  }
  return reasons;
}

/**
 * Single entrypoint for reputation + ranking consumers — never fabricates stars.
 */
export async function runReviewEngineForListing(listingId: string): Promise<ReviewEngineOutput> {
  const [agg, integrity] = await Promise.all([
    aggregateListingReviews(listingId),
    analyzeListingReviewIntegrity(listingId),
  ]);

  return {
    averageScore: agg.averageScore,
    reviewCount: agg.reviewCount,
    integrityStatus: integrity.integrityStatus,
    suspiciousPatterns: integrity.suspiciousPatterns,
    reasons: patternsToReasons(integrity.suspiciousPatterns),
  };
}
