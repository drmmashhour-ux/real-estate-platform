/**
 * Picks a canonical design template id from listing text (no DB). Used by chat + `/api/ai/recommend-template`.
 */

export type ListingForTemplate = {
  title?: string;
  description?: string;
  amenities?: string[];
  location?: { city?: string };
  photos?: unknown[];
};

export type TemplateRecommendation = {
  recommendedTemplateId: string;
  reason: string;
};

export function recommendTemplate(listing: ListingForTemplate): TemplateRecommendation {
  const hay = `${listing.title ?? ""} ${listing.description ?? ""}`.toLowerCase();
  if (/luxury|penthouse|premium|estate/i.test(hay)) {
    return {
      recommendedTemplateId: "luxury-hero-v2",
      reason: "Luxury positioning — use a hero-forward template with large imagery and serif headline.",
    };
  }
  if (/condo|loft|apartment|unit/i.test(hay)) {
    return {
      recommendedTemplateId: "urban-grid-v1",
      reason: "Urban product — grid layout highlights amenities and floor plan context.",
    };
  }
  const city = listing.location?.city?.trim();
  return {
    recommendedTemplateId: "standard-listing-v3",
    reason: city
      ? `Balanced template for ${city} — emphasizes trust, photos, and clear CTAs.`
      : "Balanced template — emphasizes trust, photos, and clear CTAs.",
  };
}
