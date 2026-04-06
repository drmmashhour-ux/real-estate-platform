/**
 * Self-learning **hints** — adjust ranking feature weights or A/B experiments; does not write DB.
 * Feed outcomes from successful vs failed bookings over time.
 */

export type ListingArchetype = {
  propertyType: string;
  priceTier: "budget" | "mid" | "premium";
  cityKey: string;
};

export type BookingOutcome = {
  archetype: ListingArchetype;
  success: boolean;
  nights: number;
};

export type RankingWeightDelta = {
  bookingsWeightDelta: number;
  contentWeightDelta: number;
  rationale: string;
};

const MAX_DELTA = 0.03;

export function suggestRankingWeightAdjustments(
  outcomes: BookingOutcome[],
  _baselineBookingsWeight = 0.4,
  _baselineContentWeight = 0.1,
): RankingWeightDelta {
  if (outcomes.length < 20) {
    return {
      bookingsWeightDelta: 0,
      contentWeightDelta: 0,
      rationale: "Insufficient sample — no weight change.",
    };
  }

  const apartment = outcomes.filter((o) => o.archetype.propertyType.toLowerCase() === "apartment");
  const aptSuccess = apartment.filter((o) => o.success).length / Math.max(1, apartment.length);
  if (apartment.length >= 10 && aptSuccess >= 0.65) {
    return {
      bookingsWeightDelta: Math.min(MAX_DELTA, 0.02),
      contentWeightDelta: 0.005,
      rationale: "Apartment archetype converting well — slightly up-weight bookings & content signals for similar listings.",
    };
  }

  return {
    bookingsWeightDelta: 0,
    contentWeightDelta: 0,
    rationale: "No significant archetype pattern — hold weights.",
  };
}
