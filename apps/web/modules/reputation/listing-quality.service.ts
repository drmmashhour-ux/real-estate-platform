import { resolveListingQualityScore } from "@/modules/bnhub-ranking/listing-quality-score.service";
import { computeListingCompletenessScore } from "./completeness-score.service";
import { computeListingMediaScore } from "./media-score.service";
import { computeListingConversionScore } from "./conversion-score.service";
import { runReviewEngineForListing } from "@/modules/reviews/review-engine.service";

export type ListingQualityBundle = {
  qualityScore: number;
  completenessScore: number;
  mediaScore: number;
  conversionScore: number;
  persistedQuality: { score: number; reasons: string[] };
  reviewIntegrity: string;
  issues: string[];
  /** Same signals as `issues`, named for ranking penalty semantics. */
  penalties: string[];
  recommendations: string[];
};

/**
 * Unified listing quality for reputation UI — wraps persisted `ListingQualityScore` when present.
 */
export async function computeListingQualityBundle(listingId: string): Promise<ListingQualityBundle> {
  const [persisted, completenessScore, mediaScore, conversionScore, reviews] = await Promise.all([
    resolveListingQualityScore(listingId),
    computeListingCompletenessScore(listingId),
    computeListingMediaScore(listingId),
    computeListingConversionScore(listingId),
    runReviewEngineForListing(listingId),
  ]);

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (completenessScore < 45) {
    issues.push("Listing text or amenities look thin for search.");
    recommendations.push("Add a longer description and complete amenity checklist.");
  }
  if (mediaScore < 40) {
    issues.push("Photo coverage is below marketplace norms.");
    recommendations.push("Add at least 6 high-quality photos including every room.");
  }
  if (reviews.integrityStatus === "high_risk") {
    issues.push("Review integrity signals need moderation review.");
  }
  if (reviews.reviewCount < 3 && reviews.averageScore != null) {
    recommendations.push("More completed stays unlock stronger social proof.");
  }

  const blended = Math.round(
    persisted.qualityScore * 0.45 + completenessScore * 0.2 + mediaScore * 0.2 + conversionScore * 0.15,
  );

  return {
    qualityScore: Math.min(100, Math.max(0, blended)),
    completenessScore,
    mediaScore,
    conversionScore,
    persistedQuality: { score: persisted.qualityScore, reasons: persisted.reasons },
    reviewIntegrity: reviews.integrityStatus,
    issues,
    penalties: [...issues],
    recommendations,
  };
}
