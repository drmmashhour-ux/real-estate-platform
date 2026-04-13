/**
 * Deterministic demand / competition / seasonality scores (0–1) for BNHUB pricing.
 */

export type DemandScoreInput = {
  views7d: number;
  views30d: number;
  bookingVelocity: number;
  occupancyRate: number;
  seasonalityMultiplier: number;
  hasActivePromotion: boolean;
  upcomingWeekendBoost: number;
  /** Higher = more competing listings in same market */
  competitionCount: number;
};

export type DemandScoreResult = {
  demandScore: number;
  competitionScore: number;
  seasonalityScore: number;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * bookingVelocity: bookings per 30 days (normalized externally, e.g. 0–3+).
 * competitionCount: raw count of published listings in same city (capped for scoring).
 */
export function calculateDemandScore(input: DemandScoreInput): DemandScoreResult {
  const viewSignal = clamp01(
    Math.log1p(input.views7d) / Math.log1p(200) * 0.55 + Math.log1p(input.views30d) / Math.log1p(800) * 0.45
  );
  const bookingSignal = clamp01(input.bookingVelocity / 3);
  const occSignal = clamp01(input.occupancyRate);

  let demand = viewSignal * 0.35 + bookingSignal * 0.35 + occSignal * 0.3;
  demand *= input.seasonalityMultiplier;
  if (input.hasActivePromotion) demand *= 1.05;
  demand += input.upcomingWeekendBoost * 0.08;
  demand = clamp01(demand);

  const comp = clamp01(Math.log1p(Math.min(input.competitionCount, 200)) / Math.log1p(200));
  const competitionScore = comp;
  demand *= 1 - comp * 0.35;
  demand = clamp01(demand);

  const seasonalityScore = clamp01((input.seasonalityMultiplier - 0.85) / 0.35);

  return {
    demandScore: demand,
    competitionScore,
    seasonalityScore,
  };
}
