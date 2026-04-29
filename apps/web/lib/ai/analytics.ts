import "server-only";

export function predictListingAnalytics(_listing: unknown): {
  expectedLeadsPerWeek: number;
  conversionPotential: string;
  rankingPotential: string;
  confidence: number;
} {
  void _listing;
  return {
    expectedLeadsPerWeek: 0,
    conversionPotential: "low",
    rankingPotential: "low",
    confidence: 0,
  };
}
