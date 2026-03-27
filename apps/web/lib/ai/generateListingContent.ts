/**
 * Generate listing content for Canva templates. Can be extended with real AI later.
 */

export type ListingForContent = {
  city?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  [key: string]: unknown;
};

export type GeneratedListingContent = {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  score: number;
  suggestions: string[];
};

export function generateListingContent(listing: ListingForContent | null): GeneratedListingContent {
  const title = `Luxury Property in ${listing?.city || "your city"}`;
  const description =
    "Beautiful modern property with premium finishes and excellent location.";

  return {
    title,
    subtitle: `${listing?.price ?? ""}$ - ${listing?.bedrooms ?? ""} beds`,
    description,
    features: ["Pool", "Garage", "Modern Kitchen"],
    score: 82,
    suggestions: [
      "Add urgency words",
      "Include neighborhood name",
      "Use price anchoring",
    ],
  };
}
