/**
 * Rule-based natural language → suggested filters (no ML).
 * Example: "cheap condo near metro" → priceSort asc, property hints.
 */

export type SearchIntentContext = "sale" | "nightly_stay";

export type SearchIntentResult = {
  original: string;
  context: SearchIntentContext;
  suggestedFilters: {
    priceMaxCents?: number;
    priceMinCents?: number;
    propertyTypeHint?: string;
    /** City / area text for the location field (rule-based). */
    locationHint?: string;
    sort?: "price_asc" | "price_desc" | "newest";
    keywords: string[];
  };
  explanation: string;
};

/**
 * @param context - `sale` = whole-property price bands (USD cents). `nightly_stay` = per-night caps for BNHUB-style search.
 */
export function parseSearchIntent(text: string, context: SearchIntentContext = "sale"): SearchIntentResult {
  const q = text.trim().toLowerCase();
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);

  let priceMaxCents: number | undefined;
  let priceMinCents: number | undefined;
  let propertyTypeHint: string | undefined;
  let sort: SearchIntentResult["suggestedFilters"]["sort"];
  const reasons: string[] = [];

  if (/\bcheap|affordable|budget|low\b/i.test(q)) {
    if (context === "nightly_stay") {
      priceMaxCents = 150_00; // $150/night (rule-based, tunable)
      sort = "price_asc";
      reasons.push("Affordability (nightly) → cap ~$150/night + sort low to high");
    } else {
      priceMaxCents = 350_000_00;
      sort = "price_asc";
      reasons.push("Affordability language → cap price + sort ascending");
    }
  }
  if (/\bexpensive|luxury|high.end|prestige\b/i.test(q)) {
    if (context === "nightly_stay") {
      priceMinCents = 220_00; // $220/night floor (heuristic)
      sort = "price_desc";
      reasons.push("Luxury (nightly) → floor ~$220/night + sort high to low");
    } else {
      priceMinCents = 800_000_00;
      sort = "price_desc";
      reasons.push("Luxury language → floor price + sort descending");
    }
  }
  if (/\bcondo|condos\b/i.test(q)) {
    propertyTypeHint = "condo";
    reasons.push("Keyword: condo");
  }
  if (/\bhouse|single.family|detached\b/i.test(q)) {
    propertyTypeHint = "house";
    reasons.push("Keyword: house");
  }

  let locationHint: string | undefined;
  const locMatch = q.match(
    /\b(?:in|near|around|à|près de|sur)\s+([a-zàâäéèêëïîôùûüç0-9\s'.-]{2,48})/i
  );
  if (locMatch?.[1]) {
    locationHint = locMatch[1].replace(/\s+/g, " ").trim().replace(/[.,;]+$/, "");
    if (locationHint.length >= 2) reasons.push(`Location: ${locationHint}`);
  }

  if (context === "nightly_stay") {
    const underNight = q.match(/\bunder\s+\$?\s*(\d{2,4})\s*(?:\/\s*night|per\s*night|a\s*night|\/n)\b/i);
    if (underNight?.[1]) {
      const n = Number(underNight[1]);
      if (n > 0 && n < 50000) {
        priceMaxCents = n * 100;
        sort = sort ?? "price_asc";
        reasons.push(`Nightly cap ~$${n}/night`);
      }
    }
    const underBare = q.match(/\bunder\s+\$?\s*(\d{2,3})\b/i);
    if (underBare?.[1] && !/\bk\b/i.test(q) && !priceMaxCents) {
      const n = Number(underBare[1]);
      if (n >= 30 && n <= 999) {
        priceMaxCents = n * 100;
        sort = sort ?? "price_asc";
        reasons.push(`Interpreted as ~$${n}/night (short-term context)`);
      }
    }
  }
  if (/\bmetro|transit|train|stm\b/i.test(q)) {
    keywords.push("near_transit");
    reasons.push("Transit proximity — apply map/transit filter in UI when available");
  }

  return {
    original: text,
    context,
    suggestedFilters: {
      priceMaxCents,
      priceMinCents,
      propertyTypeHint,
      locationHint,
      sort,
      keywords: [...new Set(keywords)],
    },
    explanation:
      reasons.length > 0
        ? reasons.join(". ")
        : "No strong intent patterns matched — use manual filters.",
  };
}
