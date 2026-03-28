/**
 * Normalize free-text cities to stable keys without mutating source rows.
 * Keys: lowercase ASCII, accents stripped, spaces → hyphens, Québec edge cases.
 */
const ACCENT_MAP: Record<string, string> = {
  à: "a",
  á: "a",
  â: "a",
  ä: "a",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ò: "o",
  ó: "o",
  ô: "o",
  ö: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ç: "c",
  ñ: "n",
};

/** Known display names per canonical key (for DB OR matching). */
export const CITY_KEY_ALIASES: Record<string, string[]> = {
  montreal: ["Montreal", "Montréal", "montreal", "MONTRÉAL"],
  laval: ["Laval", "laval"],
  "quebec-city": ["Quebec City", "Québec", "Quebec", "quebec city", "Ville de Québec"],
  gatineau: ["Gatineau", "gatineau"],
  ottawa: ["Ottawa", "ottawa"],
};

export function stripAccents(s: string): string {
  return s
    .split("")
    .map((c) => ACCENT_MAP[c] ?? ACCENT_MAP[c.toLowerCase()] ?? c)
    .join("");
}

export function normalizeCityKey(input: string): string {
  const t = stripAccents(input.trim().toLowerCase());
  if (!t) return "unknown";
  const collapsed = t.replace(/\s+/g, " ");
  if (collapsed.includes("quebec") && (collapsed.includes("city") || collapsed === "québec" || collapsed === "quebec"))
    return "quebec-city";
  if (collapsed === "montréal" || collapsed === "montreal") return "montreal";
  return collapsed.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function normalizeNeighborhood(input?: string | null): string | null {
  if (input == null || !String(input).trim()) return null;
  return stripAccents(String(input).trim())
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function expandCityKeyToDbNames(cityKey: string, profileCityName?: string | null): string[] {
  const out = new Set<string>();
  if (profileCityName?.trim()) out.add(profileCityName.trim());
  const aliases = CITY_KEY_ALIASES[cityKey] ?? [];
  for (const a of aliases) out.add(a);
  const spaced = cityKey.replace(/-/g, " ");
  out.add(spaced);
  out.add(
    spaced
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ")
  );
  return [...out].filter(Boolean);
}

export function extractCityFromListing(listing: { city?: string | null }): string | null {
  if (!listing.city?.trim()) return null;
  return listing.city.trim();
}

export function extractCityFromBooking(booking: { listing?: { city?: string | null } | null }): string | null {
  return booking.listing?.city?.trim() ? booking.listing.city.trim() : null;
}

export function extractCityFromReview(review: { listing?: { city?: string | null } | null }): string | null {
  return review.listing?.city?.trim() ? review.listing.city.trim() : null;
}

export function extractCityFromConversation(context: { city?: string | null } | null | undefined): string | null {
  const c = context?.city;
  return c?.trim() ? c.trim() : null;
}
