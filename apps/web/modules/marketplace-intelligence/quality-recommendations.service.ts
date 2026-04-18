import type { ListingQualityScore, ListingTrustScore } from "./marketplace-intelligence.types";

export type QualityRecommendationItem = {
  issue: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  recommendation: string;
  expectedImpact: string;
};

/**
 * Deterministic, explainable suggestions for operators and hosts (recommendation-only).
 */
export function buildQualityRecommendations(
  quality: ListingQualityScore,
  trust?: ListingTrustScore | null,
): QualityRecommendationItem[] {
  const out: QualityRecommendationItem[] = [];

  if (quality.warnings.some((w) => w.toLowerCase().includes("title"))) {
    out.push({
      issue: "Title clarity",
      priority: "HIGH",
      recommendation: "Expand the title to at least 12 characters with property type and location cues.",
      expectedImpact: "Improves click-through and quality score.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("description"))) {
    out.push({
      issue: "Description depth",
      priority: "HIGH",
      recommendation: "Add at least 200 characters covering layout, amenities, and guest access.",
      expectedImpact: "Reduces booking friction and lifts quality score.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("photo"))) {
    out.push({
      issue: "Visual coverage",
      priority: "HIGH",
      recommendation: "Add photos to reach at least 8 images, including living areas and sleeping spaces.",
      expectedImpact: "Stronger trust and conversion on listing cards.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("amenities"))) {
    out.push({
      issue: "Amenity coverage",
      priority: "MEDIUM",
      recommendation: "Select amenities that match the property so search filters and expectations align.",
      expectedImpact: "Better match quality and fewer post-booking disputes.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("price"))) {
    out.push({
      issue: "Pricing alignment",
      priority: "MEDIUM",
      recommendation: "Set a valid nightly price; review local comps before publishing.",
      expectedImpact: "Enables checkout and pricing intelligence signals.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("location"))) {
    out.push({
      issue: "Location completeness",
      priority: "MEDIUM",
      recommendation: "Ensure city and address lines are complete for map and policy checks.",
      expectedImpact: "Improves discovery relevance and compliance posture.",
    });
  }

  if (quality.warnings.some((w) => w.toLowerCase().includes("capacity") || w.toLowerCase().includes("guest"))) {
    out.push({
      issue: "Guest capacity",
      priority: "MEDIUM",
      recommendation: "Set max guests so pricing and occupancy rules are accurate.",
      expectedImpact: "Fewer booking conflicts and clearer trust signals.",
    });
  }

  if (trust?.riskFlags?.some((r) => r.toLowerCase().includes("verified"))) {
    out.push({
      issue: "Host verification",
      priority: "HIGH",
      recommendation: "Complete host identity and contact verification before boosting visibility.",
      expectedImpact: "Raises trust score and reduces fraud review load.",
    });
  }

  if (trust?.riskFlags?.includes("No review history")) {
    out.push({
      issue: "Social proof",
      priority: "LOW",
      recommendation: "Encourage completed stays to leave reviews; highlight house rules upfront.",
      expectedImpact: "Gradual trust lift as reviews accumulate.",
    });
  }

  if (quality.score < 55 && out.length === 0) {
    out.push({
      issue: "Overall listing quality",
      priority: "MEDIUM",
      recommendation: "Review title, photos, description, and amenities together against marketplace guidelines.",
      expectedImpact: "Composite quality score should rise with incremental fixes.",
    });
  }

  return out;
}
