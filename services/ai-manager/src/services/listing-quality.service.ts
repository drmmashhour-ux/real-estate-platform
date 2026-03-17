import type { ListingQualityInput, ListingQualityOutput } from "../models/index.js";

/**
 * Evaluates listing quality from title, description, amenities, reviews, photos.
 * Returns score 0-100 and suggested improvements.
 */
export function analyzeListingQuality(input: ListingQualityInput): ListingQualityOutput {
  const improvements: ListingQualityOutput["suggestedImprovements"] = [];
  let score = 85;

  if (!input.title || input.title.length < 15) {
    improvements.push({
      area: "title",
      priority: "high",
      suggestion: "Use a descriptive title of 15+ characters including location or key feature.",
    });
    score -= 12;
  }

  const descLen = (input.description ?? "").length;
  if (descLen < 100) {
    improvements.push({
      area: "description",
      priority: "high",
      suggestion: "Add a description of at least 100 characters describing the space and neighborhood.",
    });
    score -= 15;
  } else if (descLen < 300) {
    improvements.push({
      area: "description",
      priority: "medium",
      suggestion: "Longer descriptions (300+ characters) with amenities and house rules perform better.",
    });
    score -= 5;
  }

  const amenityCount = (input.amenities ?? []).length;
  if (amenityCount < 3) {
    improvements.push({
      area: "amenities",
      priority: "high",
      suggestion: "Add at least 3–5 amenities (e.g. WiFi, Kitchen, Parking) to improve discoverability.",
    });
    score -= 10;
  }

  const photoCount = input.photoCount ?? (input.photoUrls?.length ?? 0);
  if (photoCount < 5) {
    improvements.push({
      area: "photos",
      priority: "high",
      suggestion: "Add 5+ high-quality photos. Listings with more photos convert better.",
    });
    score -= 10;
  }

  const reviewCount = input.reviews?.length ?? 0;
  const avgRating = input.reviews?.length
    ? input.reviews.reduce((s, r) => s + r.rating, 0) / input.reviews.length
    : 0;
  if (reviewCount > 0 && avgRating < 4) {
    improvements.push({
      area: "reviews",
      priority: "medium",
      suggestion: "Address common guest feedback to improve ratings and ranking.",
    });
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  const summary =
    improvements.length === 0
      ? "Listing quality is strong. Keep photos and calendar updated."
      : `Found ${improvements.length} area(s) to improve. Focus on high-priority items first.`;

  return {
    listingQualityScore: score,
    suggestedImprovements: improvements,
    summary,
  };
}
