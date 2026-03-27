/**
 * Address normalization for Property Digital Identity.
 * Reduces formatting differences so the same property yields the same normalized form.
 */

/** Normalize string: trim, collapse spaces, lowercase for comparison, remove punctuation that varies. */
function normalizeToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[,.]/g, "")
    .replace(/\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|place|pl|court|ct)\b/gi, (m) => m.toLowerCase())
    .trim();
}

/** Normalize a full address line for storage and UID. */
export function normalizeAddress(address: string): string {
  if (!address || typeof address !== "string") return "";
  const t = normalizeToken(address);
  // Optional: replace common abbreviations consistently
  const replacements: [RegExp, string][] = [
    [/\bst\b/gi, "st"],
    [/\bavenue\b/gi, "ave"],
    [/\broad\b/gi, "rd"],
    [/\bstreet\b/gi, "st"],
    [/\bdrive\b/gi, "dr"],
    [/\bboulevard\b/gi, "blvd"],
    [/\blane\b/gi, "ln"],
    [/\bapartment\b/gi, "apt"],
    [/\bsuite\b/gi, "ste"],
    [/\bunit\b/gi, "unit"],
  ];
  let out = t;
  for (const [re, replacement] of replacements) {
    out = out.replace(re, replacement);
  }
  return out.trim();
}

/** Normalize municipality and province for UID (trim, lowercase). */
export function normalizeMunicipality(m: string | null | undefined): string {
  if (m == null || typeof m !== "string") return "";
  return m.trim().toLowerCase();
}

export function normalizeProvince(p: string | null | undefined): string {
  if (p == null || typeof p !== "string") return "";
  return p.trim().toUpperCase();
}

export function normalizeCadastreForUid(cadastre: string | null | undefined): string {
  if (cadastre == null || typeof cadastre !== "string") return "";
  return cadastre.trim().replace(/\s+/g, " ");
}
