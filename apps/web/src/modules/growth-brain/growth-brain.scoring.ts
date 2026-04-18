/**
 * Opportunity prioritization — combines external scores with brain memory when present.
 */
export function scoreOpportunity(baseScore: number, memorySuccessRate: number | undefined): number {
  const m = memorySuccessRate ?? 0.5;
  /** Slightly more weight on the current score vs memory to limit oscillation from sparse feedback. */
  const blended = baseScore * 0.8 + m * 100 * 0.2;
  return Math.max(0, Math.min(100, Math.round(blended)));
}
