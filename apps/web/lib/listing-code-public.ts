/**
 * Pure listing-code parsing (no Prisma / server-only deps) — safe for client bundles.
 */

export const LEC_LISTING_CODE_REGEX = /^LEC-(\d+)$/i;

/** Normalize user input to canonical `LEC-12345` or null if not a LEC code. */
export function normalizeListingCode(input: string | null | undefined): string | null {
  if (input == null || typeof input !== "string") return null;
  const compact = input.trim().replace(/\s+/g, "").toUpperCase();
  const m = compact.match(/^LEC-?(\d+)$/);
  if (!m) return null;
  return `LEC-${m[1]}`;
}

/** Public marketplace code `LST-XXXXXX` (6+ alphanumerics). */
export function normalizeLSTListingCode(input: string | null | undefined): string | null {
  if (input == null || typeof input !== "string") return null;
  const compact = input.trim().replace(/\s+/g, "").toUpperCase();
  const m = compact.match(/^LST-?([A-Z0-9]{6,})$/);
  if (!m) return null;
  return `LST-${m[1]}`;
}

/** LEC (legacy) or LST (new) public listing code. */
export function normalizeAnyPublicListingCode(input: string | null | undefined): string | null {
  return normalizeListingCode(input) ?? normalizeLSTListingCode(input);
}

/**
 * If the search box contains only a public listing code, return it (canonical).
 * Otherwise return null so normal city search applies.
 */
export function parseListingCodeFromSearchQuery(q: string | null | undefined): string | null {
  if (q == null || typeof q !== "string") return null;
  const t = q.trim();
  if (!t) return null;
  const lec = normalizeListingCode(t);
  if (lec) return lec;
  const lst = normalizeLSTListingCode(t);
  if (lst) return lst;
  return null;
}
