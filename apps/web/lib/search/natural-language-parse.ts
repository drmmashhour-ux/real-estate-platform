/**
 * Rule-based natural language → structured filters (swap for LLM later; keep the output shape stable).
 */

export type ParsedSearchIntent = "stay" | "investment" | "general";

export type ParsedNaturalQuery = {
  queryText: string;
  city: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  bedrooms: number | null;
  intent: ParsedSearchIntent;
};

const CITY_HINTS: { re: RegExp; city: string }[] = [
  { re: /\bmontreal\b|\bmontréal\b|\bmtl\b/i, city: "Montreal" },
  { re: /\btoronto\b|\bto\b(?=\s)/i, city: "Toronto" },
  { re: /\bvancouver\b/i, city: "Vancouver" },
  { re: /\bquebec city\b|\bquébec\b/i, city: "Quebec" },
  { re: /\bcalgary\b/i, city: "Calgary" },
];

function detectIntent(q: string): ParsedSearchIntent {
  const s = q.toLowerCase();
  if (/\b(invest|roi|cap rate|rental yield|income property|cash.?flow)\b/i.test(s)) return "investment";
  if (/\b(stay|weekend|night|vacation|book|quiet|family|downtown stay)\b/i.test(s)) return "stay";
  return "general";
}

function detectCity(q: string): string | null {
  for (const { re, city } of CITY_HINTS) {
    if (re.test(q)) return city;
  }
  return null;
}

/** Extract $250 / 250/night / under 250 */
function detectPrices(q: string): { min: number | null; max: number | null } {
  let min: number | null = null;
  let max: number | null = null;

  const under = q.match(/\b(?:under|below|less than|max|at most)\s*\$?\s*(\d{2,4})\b/i);
  if (under) max = Number(under[1]);

  const over = q.match(/\b(?:over|above|min|at least)\s*\$?\s*(\d{2,4})\b/i);
  if (over) min = Number(over[1]);

  const perNight = q.match(/\$?\s*(\d{2,4})\s*(?:\/|\s)a?\s*night/i);
  if (perNight && max == null) max = Number(perNight[1]);

  const plain = q.match(/\$\s*(\d{2,4})\b/);
  if (plain && max == null && min == null) max = Number(plain[1]);

  return {
    min: min != null && Number.isFinite(min) ? min : null,
    max: max != null && Number.isFinite(max) ? max : null,
  };
}

function detectBedrooms(q: string): number | null {
  const m = q.match(/\b(\d)\s*(?:bed|br|bedroom|bd)\b/i);
  if (m) return Number(m[1]);
  return null;
}

export function parseNaturalLanguageQuery(raw: string): ParsedNaturalQuery {
  const queryText = raw.trim().slice(0, 500);
  const intent = detectIntent(queryText);
  const city = detectCity(queryText);
  const { min: minPrice, max: maxPrice } = detectPrices(queryText);
  const bedrooms = detectBedrooms(queryText);

  return {
    queryText,
    city,
    maxPrice,
    minPrice,
    bedrooms,
    intent,
  };
}
