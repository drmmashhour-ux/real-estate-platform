/**
 * Listing quality analysis – recommendations for title, description, amenities, photos.
 * Mirrors services/ai logic; used by POST /api/ai/listing-analysis.
 */
export type ListingAnalysisInput = {
  title: string;
  description?: string;
  amenities?: string[];
  location?: { city?: string; address?: string };
  photos?: string[];
};

export type ListingAnalysisRecommendation = {
  type: "title" | "description" | "amenities" | "photos" | "location";
  priority: "high" | "medium" | "low";
  title: string;
  suggestion: string;
};

export type ListingAnalysisOutput = {
  recommendations: ListingAnalysisRecommendation[];
  overallScore: number;
  summary: string;
};

export function analyzeListing(input: ListingAnalysisInput): ListingAnalysisOutput {
  const recommendations: ListingAnalysisRecommendation[] = [];
  let score = 80;

  if (!input.title || input.title.length < 10) {
    recommendations.push({
      type: "title",
      priority: "high",
      title: "Improve title",
      suggestion:
        "Use a clear, descriptive title of 10+ characters (e.g. include location and key feature).",
    });
    score -= 15;
  } else if (!input.title.includes(" ") && input.title.length < 20) {
    recommendations.push({
      type: "title",
      priority: "medium",
      title: "Improve title",
      suggestion: "Add more detail to the title to improve search and conversion.",
    });
    score -= 5;
  }

  const descLen = (input.description ?? "").length;
  if (descLen < 100) {
    recommendations.push({
      type: "description",
      priority: "high",
      title: "Improve description clarity",
      suggestion:
        "Write at least 100 characters describing the space, neighborhood, and what guests will love.",
    });
    score -= 15;
  } else if (descLen < 300) {
    recommendations.push({
      type: "description",
      priority: "medium",
      title: "Enrich description",
      suggestion: "Longer descriptions (300+ chars) with amenities and house rules perform better.",
    });
    score -= 5;
  }

  const amenityCount = (input.amenities ?? []).length;
  if (amenityCount < 3) {
    recommendations.push({
      type: "amenities",
      priority: "high",
      title: "Add missing amenities",
      suggestion:
        "Add at least 3–5 amenities (e.g. WiFi, Kitchen, Parking, Air conditioning) to help guests filter.",
    });
    score -= 10;
  }

  const photoCount = Array.isArray(input.photos) ? input.photos.length : 0;
  if (photoCount < 5) {
    recommendations.push({
      type: "photos",
      priority: "high",
      title: "Suggest better photos",
      suggestion:
        "Listings with 5+ high-quality photos convert better. Add clear shots of each room and the exterior.",
    });
    score -= 10;
  }

  if (!input.location?.city && !input.location?.address) {
    recommendations.push({
      type: "location",
      priority: "medium",
      title: "Add location details",
      suggestion: "Add city and address so guests can find your listing in search.",
    });
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  const summary =
    recommendations.length === 0
      ? "Listing looks strong. Consider minor refinements to maximize visibility."
      : `We found ${recommendations.length} area(s) to improve. Addressing high-priority items can boost visibility and bookings.`;

  return { recommendations, overallScore: score, summary };
}
