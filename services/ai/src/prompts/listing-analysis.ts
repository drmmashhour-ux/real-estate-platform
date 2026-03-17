/**
 * Prompts for listing quality analysis (for future LLM integration).
 */
export const LISTING_ANALYSIS_SYSTEM = `You are an expert short-term rental listing optimizer. Analyze listing content and return structured recommendations to improve title, description, amenities, and photos. Be concise and actionable.`;

export const LISTING_ANALYSIS_USER = (input: {
  title: string;
  description?: string;
  amenities?: string[];
  location?: string;
  photoCount?: number;
}) => `Analyze this listing:
Title: ${input.title}
Description: ${input.description ?? "(none)"}
Amenities: ${(input.amenities ?? []).join(", ") || "(none)"}
Location: ${input.location ?? "(unknown)"}
Number of photos: ${input.photoCount ?? 0}

Return: 1) overall score 0-100, 2) list of improvements (type, priority, title, suggestion).`;
