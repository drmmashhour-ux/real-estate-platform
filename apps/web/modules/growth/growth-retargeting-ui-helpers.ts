/**
 * Small pure helpers for Growth Retargeting UI — safe defaults; no side effects.
 */

export function formatConvRate(r: number | null | undefined): string {
  if (r == null || typeof r !== "number" || Number.isNaN(r) || !Number.isFinite(r)) return "insufficient data";
  return `${(r * 100).toFixed(1)}%`;
}

export function safeSumBookingsFromPerfRows(rows: Array<{ bookings?: unknown }>): number {
  let s = 0;
  for (const p of rows) {
    const b = p.bookings;
    const n = typeof b === "number" && Number.isFinite(b) ? b : 0;
    if (n > 0) s += Math.max(0, Math.floor(n));
  }
  return s;
}

export type LearnedSourceKind = "DB" | "MEMORY" | "DEFAULT";

/**
 * Resolves how we label list provenance vs durability health (additive clarity when DB has snapshots but list queries are empty).
 */
export function resolveLearnedListSourceLabel(input: {
  learnedSource: LearnedSourceKind;
  hiDbLen: number;
  weakDbLen: number;
  hiMemLen: number;
  weakMemLen: number;
}): string {
  const { learnedSource, hiDbLen, weakDbLen, hiMemLen, weakMemLen } = input;
  const dbListsEmpty = hiDbLen === 0 && weakDbLen === 0;
  const memHasLists = hiMemLen > 0 || weakMemLen > 0;
  if (learnedSource === "DB" && dbListsEmpty && memHasLists) {
    return "SQL-backed (durability) · ranked lists from in-memory cache (DB message lists empty)";
  }
  if (learnedSource === "DB") return "SQL-backed";
  if (learnedSource === "MEMORY") return "In-memory (hydrated)";
  return "Insufficient data — heuristic fallback";
}
