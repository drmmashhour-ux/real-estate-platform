/** First-touch attribution cookie (90d). Set by middleware when URL has marketing params. */
export const LECIPM_ATTRIBUTION_COOKIE = "lecipm_attr";

export const ATTRIBUTION_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 90;

/** Trim + cap length for DB / cookie safety */
export function clampAttributionPart(s: string | undefined | null, max = 128): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}
