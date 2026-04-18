/**
 * Lightweight ranking experiment hooks keyed by One Brain trust (bounded nudges; no fabricated signals).
 */
export function applyRankingExperiment(input: { listingId: string; trustScore: number }) {
  if (input.trustScore > 0.8) {
    return { boost: 0.1 as const };
  }

  if (input.trustScore < 0.4) {
    return { penalty: -0.1 as const };
  }

  return { neutral: true as const };
}
