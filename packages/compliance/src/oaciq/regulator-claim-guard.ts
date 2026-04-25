/**
 * Marketing / UI claim control: never imply regulator endorsement or “regulated product” status.
 * Use `scanForbiddenRegulatorMarketingClaims` in CI and optional runtime checks on user-facing copy.
 */

/** Substrings matched case-insensitively after normalizing whitespace. */
export const REGULATOR_FORBIDDEN_MARKETING_PHRASES = [
  "oaciq approved",
  "approved by oaciq",
  "oaciq endorsement",
  "endorsement by oaciq",
  "regulated platform",
] as const;

/** Approved positioning examples (guidance for copy — not exhaustive). */
export const REGULATOR_MARKETING_ALLOWED_EXAMPLES = [
  "operated by licensed broker",
  "aligned with Québec regulations",
  "oaciq-aligned",
] as const;

function normalizeForScan(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export type ForbiddenClaimHit = { phrase: string; normalizedPhrase: string };

/**
 * Returns forbidden phrases found in `text` (empty if clean).
 */
export function scanForbiddenRegulatorMarketingClaims(text: string): ForbiddenClaimHit[] {
  const norm = normalizeForScan(text);
  if (!norm) return [];
  const hits: ForbiddenClaimHit[] = [];
  for (const phrase of REGULATOR_FORBIDDEN_MARKETING_PHRASES) {
    if (norm.includes(phrase)) {
      hits.push({ phrase, normalizedPhrase: phrase });
    }
  }
  return hits;
}

export class RegulatorMarketingClaimError extends Error {
  readonly hits: ForbiddenClaimHit[];

  constructor(message: string, hits: ForbiddenClaimHit[]) {
    super(message);
    this.name = "RegulatorMarketingClaimError";
    this.hits = hits;
  }
}

/**
 * Throws if copy contains forbidden regulator / endorsement claims.
 */
export function assertRegulatorMarketingClaimsSafe(text: string, contextLabel = "copy"): void {
  const hits = scanForbiddenRegulatorMarketingClaims(text);
  if (hits.length === 0) return;
  throw new RegulatorMarketingClaimError(
    `${contextLabel} must not imply OACIQ approval or that the platform is “regulated” (${hits.map((h) => h.phrase).join(", ")}).`,
    hits,
  );
}
