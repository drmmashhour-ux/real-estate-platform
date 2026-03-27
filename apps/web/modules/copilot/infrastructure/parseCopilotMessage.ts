import { normalizeCitySlug } from "@/lib/geo/city-search";

/** Extract max list price in **priceCents** (same units as FsboListing.priceCents). */
export function extractMaxPriceCents(message: string): number | null {
  const compact = message.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  const kMatch = /\b(\d+(?:\.\d+)?)\s*k\b/i.exec(compact);
  if (kMatch) {
    const thousands = parseFloat(kMatch[1]);
    if (Number.isFinite(thousands) && thousands > 0) {
      return Math.round(thousands * 1000 * 100);
    }
  }

  const underMatch = /under\s*\$?\s*(\d{3,})\b/i.exec(compact);
  if (underMatch) {
    const dollars = parseInt(underMatch[1], 10);
    if (Number.isFinite(dollars) && dollars > 0) return dollars * 100;
  }

  const dollarMatch = /\$\s*(\d{3,})\b/.exec(compact);
  if (dollarMatch) {
    const dollars = parseInt(dollarMatch[1], 10);
    if (Number.isFinite(dollars) && dollars > 0) return dollars * 100;
  }

  return null;
}

/** Returns a string suitable for `fsboCityWhereFromParam` (slug or free-text). */
export function extractCityHint(message: string): string | null {
  const t = message.trim();
  const slug = normalizeCitySlug(t);
  if (slug) return slug;

  const lower = message.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/\blaval\b/.test(lower)) return "laval";
  if (/\bmontreal\b|\bmontréal\b|\bmtl\b/.test(lower)) return "montreal";
  if (/\bquebec\b|\bquébec\b|\bquebec city\b/.test(lower)) return "quebec";

  return null;
}
