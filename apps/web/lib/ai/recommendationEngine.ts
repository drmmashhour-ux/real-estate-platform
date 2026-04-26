/**
 * Deterministic guest → BNHub stay ranking for personalization experiments and APIs.
 * Prefers: city match, price within budget, strong ratings, optional property/behavior signals.
 */
export type GuestRecommendationPrefs = {
  preferredCity?: string;
  /** Max acceptable nightly price (major units, same as listing night rate). */
  budget?: number;
  preferredPropertyType?: string;
  /** Cities the user has viewed or saved (soft boost). */
  interestCities?: string[];
  /** If true, extra weight for listings whose city appears in `interestCities`. */
  behaviorBoost?: boolean;
};

export type ListingsForRecommend = {
  id: string;
  city: string;
  country?: string | null;
  propertyType?: string | null;
  /** Nightly price in major units (e.g. from `nightPriceCents / 100`). */
  price: number;
  /** Guest review average 1–5 or null. */
  rating: number | null;
  /** Carried through from SQL / Prisma; used for display. */
  title?: string;
  nightPriceCents?: number;
};

export type ScoredListing = ListingsForRecommend & { score: number; scoreBreakdown: Record<string, number> };

const norm = (s: string) => s.trim().toLowerCase();

export function recommendListings(
  user: GuestRecommendationPrefs,
  listings: ListingsForRecommend[]
): ScoredListing[] {
  const preferred = user.preferredCity ? norm(user.preferredCity) : "";
  const interest = new Set(
    (user.interestCities ?? []).map((c) => norm(c)).filter(Boolean)
  );
  const budget =
    typeof user.budget === "number" && Number.isFinite(user.budget) && user.budget > 0
      ? user.budget
      : null;
  const propPref = user.preferredPropertyType?.trim().toLowerCase() ?? "";
  const behavior = user.behaviorBoost === true;

  return listings
    .map((l) => {
      const breakdown: Record<string, number> = {};
      let score = 0;

      if (preferred && norm(l.city) === preferred) {
        breakdown.preferredCity = 5;
        score += 5;
      }

      if (budget != null && l.price > 0 && l.price <= budget) {
        breakdown.withinBudget = 3;
        score += 3;
      }

      const r = l.rating;
      if (r != null && r >= 4.5) {
        breakdown.highRating = 2;
        score += 2;
      }

      if (propPref && l.propertyType && l.propertyType.toLowerCase().includes(propPref)) {
        breakdown.propertyType = 1.5;
        score += 1.5;
      }

      if (behavior && interest.size > 0 && interest.has(norm(l.city))) {
        breakdown.interestCity = 1;
        score += 1;
      }

      return { ...l, score, scoreBreakdown: breakdown };
    })
    .sort((a, b) => b.score - a.score);
}
