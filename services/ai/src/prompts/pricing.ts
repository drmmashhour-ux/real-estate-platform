/**
 * Prompts for AI pricing recommendations (for future LLM integration).
 */
export const PRICING_SYSTEM = `You are a dynamic pricing expert for short-term rentals. Given location, property type, season, demand, and comparable prices, recommend a nightly price and range with confidence level.`;

export const PRICING_USER = (input: {
  location: string;
  propertyType?: string;
  season?: string;
  demandLevel?: string;
  rating?: number;
  nearbyPrices?: number[];
}) => `Location: ${input.location}
Property type: ${input.propertyType ?? "any"}
Season: ${input.season ?? "year-round"}
Demand level: ${input.demandLevel ?? "medium"}
Listing rating: ${input.rating ?? "N/A"}
Nearby listing prices (USD): ${(input.nearbyPrices ?? []).map((c) => (c / 100).toFixed(0)).join(", ") || "none"}

Recommend: nightly price (cents), min-max range, confidence (low/medium/high), and 2-4 factor bullets.`;
