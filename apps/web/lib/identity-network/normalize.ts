/**
 * Legal name normalization for identity resolution.
 * Used for owner, broker, and organization names.
 */

function collapseSpaces(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function removePunctuation(s: string): string {
  return s.replace(/[,.'"]/g, "").trim();
}

/** Normalize legal name for storage and matching: trim, collapse spaces, remove common punctuation. */
export function normalizeLegalName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "";
  const t = collapseSpaces(removePunctuation(name));
  return t.toLowerCase();
}

/** Normalize company/organization name (same as legal name for now). */
export function normalizeOrganizationName(name: string | null | undefined): string {
  return normalizeLegalName(name);
}
