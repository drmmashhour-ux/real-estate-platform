/**
 * Deterministic detection helpers — string heuristics only, no OCR.
 */

const COL_TYPE_MARKERS = [
  "certificate_of_location",
  "certificat",
  "localisation",
  "localization",
  "location",
] as const;

export function looksLikeCertificateOfLocationType(certificateType: string | undefined | null): boolean {
  if (!certificateType || typeof certificateType !== "string") return false;
  const s = certificateType.trim().toLowerCase();
  if (!s) return false;
  if (s.includes("environment") || s.includes("lead") || s.includes("energy")) return false;
  return COL_TYPE_MARKERS.some((m) => m !== "location" ? s.includes(m) : /\blocation\b/.test(s) || s.includes("localisation"));
}

export function parseIsoDateBoundary(isoLike: string | undefined | null): number | null {
  if (!isoLike || typeof isoLike !== "string") return null;
  const t = Date.parse(isoLike);
  return Number.isFinite(t) ? t : null;
}

/** ~365-day staleness heuristic for platform reminders only — not legal validity. */
export function isLikelyStaleIssueDateMs(issueMs: number | null, nowMs: number): boolean {
  if (issueMs === null) return false;
  const delta = nowMs - issueMs;
  return delta > 365 * 86_400_000;
}
