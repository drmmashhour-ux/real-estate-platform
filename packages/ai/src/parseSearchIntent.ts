/**
 * Natural language → structured search (regex/heuristics; LLM can replace later).
 * Builds on `parseVoiceQuery` for property sale/rent; adds stays + monthly rent.
 */

import { parseVoiceQuery, type ParsedVoiceQuery } from "@/lib/search/parseVoiceQuery";
import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { DEFAULT_GLOBAL_FILTERS, DEFAULT_STAYS_FILTERS } from "@/components/search/FilterState";

export type SearchCategory = "sale" | "rent" | "stay" | "commercial" | "unknown";

export type ParsedSearchIntent = {
  category: SearchCategory;
  /** Property browse (sale/rent/commercial) */
  property?: ParsedVoiceQuery;
  /** Short-term stay fields */
  stayCity?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  /** Monthly rent cap (CAD/month) when category rent */
  monthlyRentMax?: number;
  /** Raw features for URL features= */
  featureSlugs: string[];
};

function hasStayKeywords(q: string): boolean {
  return /\b(?:short[- ]term|short stay|nightly|per night|airbnb|weekend|this weekend|hotel|bnb|bnhub|vacation rental)\b/i.test(
    q
  );
}

function hasRentKeywords(q: string): boolean {
  return /\b(?:for rent|rental|lease|apartment to rent|monthly rent)\b/i.test(q);
}

/** Next Saturday → Sunday as ISO dates (UTC slice; good enough for MVP). */
export function nextWeekendRange(now: Date): { checkIn: string; checkOut: string } {
  const d = new Date(now);
  const day = d.getDay();
  const addDays = (6 - day + 7) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() + addDays);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { checkIn: iso(sat), checkOut: iso(sun) };
}

/**
 * Parse user message into category + filters.
 */
export function parseSearchIntent(message: string, now: Date = new Date()): ParsedSearchIntent {
  const q = message.replace(/\s+/g, " ").trim();
  const lower = q.toLowerCase();
  const featureSlugs: string[] = [];
  if (/\bparking\b/i.test(q)) featureSlugs.push("parking");
  if (/\bpet(?:s)?\b/i.test(q) && /\ballowed\b/i.test(q)) featureSlugs.push("pets");
  if (/\bfurnish/i.test(q)) featureSlugs.push("furnished");

  if (/\bcommercial\b/i.test(q)) {
    const p = parseVoiceQuery(q);
    return { category: "commercial", property: { ...p, segment: "commercial" }, featureSlugs };
  }

  if (hasStayKeywords(q)) {
    const p = parseVoiceQuery(q);
    let checkIn: string | undefined;
    let checkOut: string | undefined;
    if (/\bthis weekend\b|\bweekend\b/i.test(q)) {
      const w = nextWeekendRange(now);
      checkIn = w.checkIn;
      checkOut = w.checkOut;
    }
    const gMatch = lower.match(/(\d+)\s*guests?/);
    const guests = gMatch ? Math.min(20, Math.max(1, parseInt(gMatch[1], 10))) : undefined;
    return {
      category: "stay",
      stayCity: p.city,
      guests,
      checkIn,
      checkOut,
      property: p,
      featureSlugs,
    };
  }

  if (hasRentKeywords(q) || /\b(?:under|below)\s*\$?\s*\d{3,4}\b(?!\s*k)/i.test(q)) {
    const p = parseVoiceQuery(q);
    let monthlyRentMax: number | undefined;
    const m = lower.match(/\b(?:under|below|max)\s*\$?\s*(\d{3,5})\b(?!\s*k)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 300 && n < 50000) monthlyRentMax = n;
    }
    return {
      category: "rent",
      property: { ...p, segment: p.segment || "for-rent" },
      monthlyRentMax,
      featureSlugs,
    };
  }

  const p = parseVoiceQuery(q);
  if (p.segment === "for-rent") {
    return { category: "rent", property: p, monthlyRentMax: undefined, featureSlugs };
  }
  if (p.segment === "commercial") {
    return { category: "commercial", property: p, featureSlugs };
  }

  if (/\b(?:buy|sale|for sale|condo|house|townhouse|bedroom)\b/i.test(q) || p.city || p.maxPrice || p.beds) {
    return { category: "sale", property: { ...p, segment: p.segment || "residential" }, featureSlugs };
  }

  return { category: "unknown", property: p, featureSlugs };
}

/** Merge follow-up like "only condos" or "under 500k" onto last filters + new parse */
export function mergeFollowUpSearch(
  last: Partial<GlobalSearchFiltersExtended> | null,
  message: string
): Partial<GlobalSearchFiltersExtended> | null {
  const parsed = parseSearchIntent(message);
  const base: GlobalSearchFiltersExtended = {
    ...DEFAULT_GLOBAL_FILTERS,
    ...last,
  };
  const p = parsed.property;
  if (!p && !parsed.monthlyRentMax) return last;

  let next: GlobalSearchFiltersExtended = { ...base };
  if (p?.city) next.location = p.city;
  if (p?.maxPrice) next.priceMax = p.maxPrice;
  if (p?.minPrice) next.priceMin = p.minPrice;
  if (p?.beds != null) next.bedrooms = p.beds;
  if (p?.propertyTypes?.length) {
    next.propertyTypes = [...p.propertyTypes];
    next.propertyType = "";
  }
  if (parsed.monthlyRentMax) next.priceMax = parsed.monthlyRentMax;
  return next;
}

export function stayFiltersFromIntent(parsed: ParsedSearchIntent): GlobalSearchFiltersExtended {
  const f: GlobalSearchFiltersExtended = {
    ...DEFAULT_STAYS_FILTERS,
    type: "short",
    location: parsed.stayCity ?? parsed.property?.city ?? "",
    guests: parsed.guests ?? null,
    checkIn: parsed.checkIn ?? "",
    checkOut: parsed.checkOut ?? "",
  };
  if (parsed.property?.maxPrice) {
    f.priceMax = parsed.property.maxPrice;
    f.priceMin = 0;
  }
  if (parsed.property?.beds != null) f.bedrooms = parsed.property.beds;
  return f;
}
