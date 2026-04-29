/**
 * Rule-based listing copy helpers for host/manager chat (+ tests). Pure functions — no DB.
 */

export type OptimizeChatListingInput = {
  title?: string;
  description?: string;
  amenities?: string[];
  location?: { city?: string; address?: string };
  photos?: unknown[];
};

export function rewriteTitle(listing: OptimizeChatListingInput): string {
  const t = (listing.title ?? "Premium property").trim();
  const city = (listing.location?.city ?? "").trim();
  if (city && !t.toLowerCase().includes(city.toLowerCase())) {
    return `${t} — ${city}`;
  }
  return t;
}

export function rewriteDescription(listing: OptimizeChatListingInput): string {
  const d = (listing.description ?? "").trim();
  const city = (listing.location?.city ?? "").trim();
  const base = d || "Well-located property with strong market appeal.";
  return city ? `${base} Located in ${city}.` : base;
}

export function addSeoKeywords(listing: OptimizeChatListingInput): string[] {
  const city = (listing.location?.city ?? "").trim() || "Québec";
  return [
    `${city} real estate`,
    `${city} property listing`,
    `${city} home search`,
    `${city} brokerage`,
  ];
}

export type OptimizeListingLiteResult = {
  optimizedTitle: string;
  optimizedDescription: string;
  seoKeywords: string[];
};

/** Used by `/api/ai/chat` rule-based replies — fast, deterministic suggestions. */
export function optimizeListing(listing: OptimizeChatListingInput): OptimizeListingLiteResult {
  return {
    optimizedTitle: rewriteTitle(listing),
    optimizedDescription: rewriteDescription(listing),
    seoKeywords: addSeoKeywords(listing),
  };
}
