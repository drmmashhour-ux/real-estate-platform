import type { ConversionIntentLevel, ConversionNudge, ConversionScore } from "./conversionTypes";

const WEIGHT = {
  repeatView: 0.2,
  sameCityViews: 0.15,
  feedClick: 0.1,
  searchActivity: 0.08,
  savedListing: 0.12,
  bookingStarted: 0.35,
  demand: 0.1,
  priceIncrease: 0.05,
} as const;

const DEMAND_SCORE_HIGH = 0.35;

export type ConversionSignals = {
  viewsThisListing: number;
  viewsInSameCity: number;
  hasFeedClick: boolean;
  hasSearchActivity: boolean;
  hasSavedListing: boolean;
  hasBookingStarted: boolean;
  demandScoreForCity: number;
  priceIncreaseRecommended: boolean;
  /** From {@link generateSocialProof} on real listing metrics (Order 47). */
  socialProofStrength?: "low" | "medium" | "high";
  /** From {@link getListingReputation} / {@link computeListingReputationFromMetrics} in `reputationScoringCore` (Order 48). */
  reputationLevel?: "low" | "medium" | "high";
  /** Order A.1 — real calendar occupancy (0..1); when high, nudges score up (no false scarcity). */
  listingOccupancyRate?: number;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function intentFromScore(s: number): ConversionIntentLevel {
  if (s >= 0.7) return "high";
  if (s >= 0.4) return "medium";
  return "low";
}

/** True when attention/demand copy is supported by tracked signals (safety). */
export function canUseAttentionWording(s: ConversionSignals): boolean {
  if (s.viewsThisListing >= 2) return true;
  if (s.hasBookingStarted) return true;
  if (s.demandScoreForCity >= DEMAND_SCORE_HIGH) return true;
  if (s.viewsInSameCity >= 3) return true;
  return false;
}

export function convertSignalsToScore(
  listingId: string,
  userId: string | undefined,
  sig: ConversionSignals
): ConversionScore {
  const reasons: string[] = [];
  let score = 0;

  if (sig.viewsThisListing >= 2) {
    score += WEIGHT.repeatView;
    reasons.push("repeated_listing_view");
  } else if (sig.viewsThisListing === 1) {
    score += WEIGHT.repeatView * 0.5;
    reasons.push("listing_view");
  }

  if (sig.viewsInSameCity >= 2) {
    score += WEIGHT.sameCityViews;
    reasons.push("same_city_listing_views");
  } else if (sig.viewsInSameCity === 1) {
    score += WEIGHT.sameCityViews * 0.45;
    reasons.push("same_city_activity");
  }

  if (sig.hasFeedClick) {
    score += WEIGHT.feedClick;
    reasons.push("feed_click");
  }
  if (sig.hasSearchActivity) {
    score += WEIGHT.searchActivity;
    reasons.push("search_events");
  }
  if (sig.hasSavedListing) {
    score += WEIGHT.savedListing;
    reasons.push("saved_listing");
  }
  if (sig.hasBookingStarted) {
    score += WEIGHT.bookingStarted;
    reasons.push("booking_started");
  }
  /** Funnel: guest opened checkout for this stay — cap intent at high (spec: booking_started → high). */
  if (sig.hasBookingStarted) {
    score = Math.max(score, 0.72);
  }
  if (sig.demandScoreForCity >= DEMAND_SCORE_HIGH) {
    score += WEIGHT.demand;
    reasons.push("high_city_demand");
  } else if (sig.demandScoreForCity > 0) {
    score += WEIGHT.demand * 0.4;
    reasons.push("city_demand");
  }

  if (sig.priceIncreaseRecommended) {
    score += WEIGHT.priceIncrease;
    reasons.push("price_increase_recommended");
  }

  if (sig.socialProofStrength === "high") {
    score += 0.15;
    reasons.push("High user engagement on this listing");
  }

  if (sig.reputationLevel === "high") {
    score += 0.1;
    reasons.push("Trusted listing with strong performance");
  }

  if (sig.listingOccupancyRate != null && sig.listingOccupancyRate > 0.7) {
    score += 0.1;
    reasons.push("Listing is frequently booked");
  }

  const finalScore = clamp01(score);
  let intentLevel = intentFromScore(finalScore);
  if (sig.hasBookingStarted) {
    intentLevel = "high";
  }
  const canUseHighAttentionCopy = canUseAttentionWording(sig);

  return {
    listingId,
    userId,
    score: finalScore,
    intentLevel,
    reasons,
    canUseHighAttentionCopy,
  };
}

export function getConversionNudge(score: ConversionScore): ConversionNudge {
  const canShowHigh = score.intentLevel === "high" && score.canUseHighAttentionCopy;
  const displayLevel: ConversionIntentLevel =
    score.intentLevel === "high" && !score.canUseHighAttentionCopy ? "medium" : score.intentLevel;

  if (canShowHigh) {
    return {
      title: "This listing is getting attention",
      message:
        "Listings like this can move quickly in this market, based on recent traveler activity in our data.",
      intentLevel: score.intentLevel,
      displayLevel: "high",
    };
  }
  if (displayLevel === "medium" || score.intentLevel === "medium") {
    return {
      title: "Good match for your search",
      message: "This listing matches your recent activity and preferences.",
      intentLevel: score.intentLevel,
      displayLevel: "medium",
    };
  }
  return {
    title: "Explore your options",
    message: "Compare similar listings before making a decision.",
    intentLevel: "low",
    displayLevel: "low",
  };
}

export function emptyConversionScore(listingId: string, userId?: string): ConversionScore {
  return {
    listingId,
    userId,
    score: 0.05,
    intentLevel: "low",
    reasons: [],
    canUseHighAttentionCopy: false,
  };
}
