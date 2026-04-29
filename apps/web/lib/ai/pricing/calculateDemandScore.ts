import "server-only";

export type DemandInputs = {
  views7d: number;
  views30d: number;
  bookingVelocity: number;
  occupancyRate: number;
  seasonalityMultiplier: number;
  hasActivePromotion: boolean;
  upcomingWeekendBoost: number;
  competitionCount: number;
};

export function calculateDemandScore(input: DemandInputs): {
  demandScore: number;
  competitionScore: number;
  seasonalityScore: number;
} {
  void input;
  return {
    demandScore: 40,
    competitionScore: 40,
    seasonalityScore: 40,
  };
}
