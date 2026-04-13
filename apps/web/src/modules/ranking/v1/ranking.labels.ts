export type PerformanceBand = "elite" | "good" | "average" | "weak";

/**
 * Map 0–100 total ranking score to a coarse band for dashboards / optional UI badges.
 */
export function performanceBandFromTotalScore(totalScore0to100: number): PerformanceBand {
  const s = Number.isFinite(totalScore0to100) ? totalScore0to100 : 0;
  if (s >= 85) return "elite";
  if (s >= 70) return "good";
  if (s >= 50) return "average";
  return "weak";
}

/** Public-safe label; does not expose raw score. */
export function publicBandLabel(band: PerformanceBand): string {
  switch (band) {
    case "elite":
      return "Top listing";
    case "good":
      return "Strong listing";
    case "average":
      return "Good visibility";
    case "weak":
      return "Could improve";
    default:
      return "";
  }
}
