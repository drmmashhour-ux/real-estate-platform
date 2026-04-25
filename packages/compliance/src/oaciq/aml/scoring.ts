import type { AMLCheck, AMLGate } from "@/lib/compliance/oaciq/aml/types";

/**
 * Global AML score from triggered checks — mean of catalog `risk_score` (per spec).
 * Empty list → 0 (no elevation).
 */
export function computeAMLScore(flags: readonly AMLCheck[]): number {
  if (flags.length === 0) return 0;
  const sum = flags.reduce((acc, r) => acc + r.risk_score, 0);
  return Math.round((sum / flags.length) * 100) / 100;
}

/** Policy gate on aggregated score (spec thresholds). */
export function shouldBlockTransaction(score: number): AMLGate {
  if (score > 85) return "BLOCK";
  if (score > 70) return "REVIEW_REQUIRED";
  return "OK";
}
