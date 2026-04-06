/**
 * Safe description normalization for permission-based listings.
 * Does not preserve third-party wording — use as a hygiene step before human review.
 *
 * @see docs/compliance/safe-listing-acquisition.md
 */

const MAX_LEN = 12_000;

/** Remove common paste artifacts; keep text factual and readable. */
export function normalizeListingDescription(input: string): { text: string; truncated: boolean; changed: boolean } {
  const raw = input ?? "";
  let s = raw.replace(/\u200B|\uFEFF/g, "").trim();

  // Collapse runs of spaces/tabs (preserve single newlines temporarily)
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Max two consecutive newlines
  s = s.replace(/\n{3,}/g, "\n\n");
  // Strip heavy markdown-ish clutter from careless pastes (light touch)
  s = s.replace(/\*{3,}/g, "");
  s = s.replace(/#{1,6}\s*/g, "");

  const truncated = s.length > MAX_LEN;
  if (truncated) {
    s = s.slice(0, MAX_LEN).trim();
  }

  const changed = s !== raw.trim();
  return { text: s, truncated, changed };
}
