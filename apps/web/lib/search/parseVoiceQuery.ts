/**
 * Heuristic parse of spoken property search (English / fr-CA friendly).
 * No backend — rule-based extraction for quick search MVP.
 */

export type VoiceSegment = "" | "residential" | "for-rent" | "commercial";

export type ParsedVoiceQuery = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  /** Matches QuickPropertySearchForm segment */
  segment: VoiceSegment;
  /** e.g. condo, apartment */
  propertyKind?: string | null;
  /** Listing API slugs (CONDO, HOUSE, …) */
  propertyTypes?: string[];
};

const KNOWN: { re: RegExp; city: string }[] = [
  { re: /\bmontréal|montreal|\bmtl\b/i, city: "Montreal" },
  { re: /\blaval\b/i, city: "Laval" },
  { re: /\bgatineau\b/i, city: "Gatineau" },
  { re: /\bsherbrooke\b/i, city: "Sherbrooke" },
  { re: /\b(?:trois-?rivières|trois-rivieres)\b/i, city: "Trois-Rivières" },
  { re: /\b(?:québec city|quebec city|ville de québec)\b/i, city: "Québec" },
  { re: /\b(?:greater )?montréal area\b/i, city: "Montreal" },
  { re: /\b(?:north|south) shore(?: of)? montreal\b/i, city: "Montreal" },
  { re: /\bquebec\b(?! city)/i, city: "Québec" },
];

function parsePriceK(s: string): number | undefined {
  const n = Number.parseFloat(s.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 1000);
}

function parsePricePlain(s: string): number | undefined {
  const n = Number.parseInt(s.replace(/\s/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

/**
 * Extract city, price bounds, beds, segment, and residential property type hints.
 */
export function parseVoiceQuery(raw: string): ParsedVoiceQuery {
  const q = raw.replace(/\s+/g, " ").trim();
  const lower = q.toLowerCase();
  const out: ParsedVoiceQuery = { segment: "" };

  const bedM = lower.match(/(\d+)\s*(?:bed|bedroom|bedrooms|br)\b/);
  if (bedM) {
    const b = Number.parseInt(bedM[1], 10);
    if (Number.isFinite(b) && b >= 1 && b <= 20) out.beds = Math.min(5, b);
  }

  // --- Price: under / below / max (thousands)
  const underK = lower.match(
    /\b(?:under|below|less than|at most|up to|max(?:imum)?)\s*\$?\s*(\d{1,3}(?:[.,]\d+)?)\s*k\b/
  );
  const underM = lower.match(
    /\b(?:under|below|less than|max)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*m(?:illion)?\b/
  );
  const plainHigh = lower.match(
    /\b(?:under|below|less than|max)\s*\$?\s*(\d{3,7})\b(?!\s*k|\s*m)/
  );
  if (underK) {
    const v = parsePriceK(underK[1]);
    if (v) out.maxPrice = v;
  } else if (underM) {
    const n = Number.parseFloat(underM[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) out.maxPrice = Math.round(n * 1_000_000);
  } else if (plainHigh) {
    const v = parsePricePlain(plainHigh[1]);
    if (v && v >= 10_000) out.maxPrice = v;
  }

  // "600k" without "under"
  if (out.maxPrice == null) {
    const bareK = lower.match(/\$\s*(\d{1,3})\s*k\b/);
    if (bareK) {
      const v = parsePriceK(bareK[1]);
      if (v) out.maxPrice = v;
    }
  }

  // between X and Y (thousands)
  const betweenK = lower.match(
    /\b(?:between|from)\s*\$?\s*(\d{1,3})\s*k\s*(?:and|to|-|–)\s*\$?\s*(\d{1,3})\s*k\b/
  );
  if (betweenK) {
    const a = parsePriceK(betweenK[1]);
    const b = parsePriceK(betweenK[2]);
    if (a && b) {
      out.minPrice = Math.min(a, b);
      out.maxPrice = Math.max(a, b);
    }
  }

  // --- Segment
  if (/\b(?:for rent|to rent|rental|lease|long[- ]term rent)\b/i.test(q)) {
    out.segment = "for-rent";
  } else if (/\bcommercial\b/i.test(q)) {
    out.segment = "commercial";
  } else if (/\b(?:house|condo|townhouse|apartment|residential|single[- ]family)\b/i.test(q)) {
    out.segment = "residential";
  }

  // --- Property type slugs (sale / residential)
  const types: string[] = [];
  if (/\bcondo|condominium|loft\b/i.test(q)) {
    types.push("CONDO");
    out.propertyKind = "condo";
  }
  if (/\bapartment|flat\b/i.test(q) && !types.includes("CONDO")) {
    types.push("CONDO");
    out.propertyKind = out.propertyKind ?? "apartment";
  }
  if (/\b(?:single[- ]family|detached )?house\b|\bdetached\b|\bbungalow\b/i.test(q)) {
    types.push("SINGLE_FAMILY");
    out.propertyKind = out.propertyKind ?? "house";
  }
  if (/\btownhouse|town house\b/i.test(q)) {
    types.push("TOWNHOUSE");
    out.propertyKind = out.propertyKind ?? "townhouse";
  }
  if (types.length) out.propertyTypes = [...new Set(types)];

  // --- City
  for (const { re, city } of KNOWN) {
    if (re.test(q)) {
      out.city = city;
      break;
    }
  }
  if (!out.city) {
    const inPhrase = q.match(
      /\b(?:in|near|around|at)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-']{1,48}?)(?=\s*(?:under|below|for|with|and|,|\d+\s*bed|$))/i
    );
    if (inPhrase) {
      const word = inPhrase[1].trim();
      if (word.length >= 3 && !/^(a|the|my|for|with)$/i.test(word)) {
        out.city = word.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }

  return out;
}

export function voiceParseHasSignal(p: ParsedVoiceQuery): boolean {
  return !!(
    (p.city && p.city.trim().length > 0) ||
    (p.maxPrice != null && p.maxPrice > 0) ||
    (p.minPrice != null && p.minPrice > 0) ||
    (p.beds != null && p.beds > 0) ||
    p.segment !== "" ||
    (p.propertyTypes && p.propertyTypes.length > 0)
  );
}

/** Short spoken summary for speechSynthesis (English). */
export function voiceFeedbackEnglish(p: ParsedVoiceQuery): string {
  const parts: string[] = ["Showing"];
  if (p.propertyTypes?.includes("CONDO") && p.propertyTypes.length === 1) {
    parts.push("condos");
  } else if (p.propertyTypes?.includes("SINGLE_FAMILY")) {
    parts.push("houses");
  } else {
    parts.push("listings");
  }
  if (p.city) parts.push(`in ${p.city}`);
  if (p.beds) parts.push(`${p.beds} bedroom${p.beds === 1 ? "" : "s"}`);
  if (p.maxPrice && p.maxPrice >= 1000) {
    const k = Math.round(p.maxPrice / 1000);
    parts.push(`under ${k} thousand dollars`);
  }
  if (parts.length <= 1) return "Search updated.";
  return parts.join(" ") + ".";
}
