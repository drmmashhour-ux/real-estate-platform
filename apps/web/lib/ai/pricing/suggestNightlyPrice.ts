import "server-only";

export function suggestNightlyPrice(input: {
  currentNightly: number;
  hostSettings: unknown;
  demand: {
    demandScore: number;
    competitionScore: number;
    seasonalityScore: number;
  };
  occupancyRate: number;
  bookingVelocity: number;
}): {
  currentPrice: number;
  suggestedPrice: number;
  deltaPct: number;
  confidenceScore: number;
  reasonSummary: string;
} {
  void input.hostSettings;
  void input.demand;
  void input.occupancyRate;
  void input.bookingVelocity;
  const cur = Number(input.currentNightly);
  return {
    currentPrice: cur,
    suggestedPrice: cur,
    deltaPct: 0,
    confidenceScore: 0,
    reasonSummary: "stub_nightly_price",
  };
}
