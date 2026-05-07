/**
 * Appraisal adjustment math — stub for deployment.
 */
export function adjustedPriceCents(
  basePriceCents: number,
  adjustments: { factor: number; label: string }[]
): number {
  let total = basePriceCents;
  for (const adj of adjustments) {
    total += Math.round(basePriceCents * adj.factor);
  }
  return Math.max(0, total);
}
