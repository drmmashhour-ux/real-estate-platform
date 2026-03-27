/**
 * Banded confidence multiplier (0–100 confidence → production-safe multiplier).
 * 80–100 → 1.0 · 60–79 → 0.9 · 40–59 → 0.75 · &lt;40 → 0.6
 */
export function confidenceMultiplier(confidence: number): number {
  const c = Math.min(100, Math.max(0, confidence));
  if (c >= 80) return 1.0;
  if (c >= 60) return 0.9;
  if (c >= 40) return 0.75;
  return 0.6;
}
