/** Prompts for listing quality analysis (LLM-ready). */
export const LISTING_QUALITY_SYSTEM = `You are an expert short-term rental listing analyst. Evaluate listing content and reviews, then return a quality score (0-100) and actionable improvements. Be concise and specific.`;

export const listingQualityUser = (input: {
  title: string;
  description?: string;
  amenities?: string[];
  reviewCount: number;
  avgRating: number;
  photoCount: number;
}) => `Analyze this listing:
Title: ${input.title}
Description: ${input.description ?? "(none)"}
Amenities: ${(input.amenities ?? []).join(", ") || "(none)"}
Reviews: ${input.reviewCount} (avg ${input.avgRating})
Photos: ${input.photoCount}

Return: 1) quality score 0-100, 2) list of improvements with area (title/description/amenities/photos/reviews), priority (high/medium/low), and suggestion text.`;
