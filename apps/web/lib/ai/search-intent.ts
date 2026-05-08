/**
 * Lightweight NLP intent parser for search queries.
 * Used by POST /api/ai/search/intent.
 */

export type SearchIntentResult = {
  intent: "property_search" | "stay_search" | "general" | "unknown";
  location?: string;
  priceMax?: number;
  beds?: number;
  category: "sale" | "nightly_stay";
  raw: string;
};

export function parseSearchIntent(
  query: string,
  context: "sale" | "nightly_stay" = "sale"
): SearchIntentResult {
  const q = query.trim();
  if (!q) return { intent: "unknown", category: context, raw: q };

  const lower = q.toLowerCase();
  const result: SearchIntentResult = { intent: "general", category: context, raw: q };

  if (/\b(stay|night|airbnb|bnhub|séjour|nuit|hébergement)\b/i.test(lower)) {
    result.intent = "stay_search";
    result.category = "nightly_stay";
  } else if (/\b(buy|sell|condo|house|apartment|maison|achat|vente|propriété)\b/i.test(lower)) {
    result.intent = "property_search";
    result.category = "sale";
  }

  const cityMatch = lower.match(/\b(?:in|à|near)\s+([a-zA-ZÀ-ÿ\s-]{2,30}?)(?:\s|$|,)/);
  if (cityMatch) result.location = cityMatch[1].trim();

  const priceMatch = lower.match(/(?:under|below|moins de|<)\s*\$?\s*(\d+)\s*k?\b/);
  if (priceMatch) {
    const n = parseInt(priceMatch[1], 10);
    result.priceMax = lower.includes("k") ? n * 1000 : n;
  }

  const bedMatch = lower.match(/(\d+)\s*(?:bed|bedroom|chambre|br)\b/);
  if (bedMatch) result.beds = parseInt(bedMatch[1], 10);

  return result;
}
