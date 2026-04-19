/**
 * Deterministic city label normalization for grouping Fast Deal events (internal).
 */

/** NFC + lowercase + trim — compare display names loosely. */
export function normalizeFastDealCityKey(raw: string): string {
  const t = raw.normalize("NFKC").trim().toLowerCase();
  return t.replace(/\s+/g, " ");
}
