/**
 * BNHub guest-facing ranking hints, trust risk tiers, listing quality, and light fraud heuristics.
 * Suggestions only — never auto-apply pricing or messages.
 */

export type BnhubListingRiskLevel = "low" | "medium" | "high";

export type BnhubFraudHeuristic = {
  level: "ok" | "watch";
  reason?: string;
};

export type BnhubListingQualityReport = {
  ok: boolean;
  issues: string[];
  headline: string;
};

export type BnhubGuestListingAnnotations = {
  riskLevel: BnhubListingRiskLevel;
  valueScore: number;
  valueLabel: "Best value" | "Great price" | null;
  fraud: BnhubFraudHeuristic;
  verified: boolean;
  displayRating: number | null;
  displayReviewCount: number;
};

const MIN_DESCRIPTION_CHARS = 120;
const MIN_PHOTOS = 5;
const MIN_AMENITIES = 3;

export function computeBnhubTrustRiskLevel(input: {
  verificationStatus?: string | null;
  reviewCount: number;
  avgRating?: number | null;
  operationalRiskScore?: number | null;
}): BnhubListingRiskLevel {
  const op = input.operationalRiskScore;
  if (op != null && op > 65) return "high";
  if (input.verificationStatus !== "VERIFIED") return "medium";
  if (input.reviewCount === 0) return "medium";
  if (input.avgRating != null && input.avgRating < 3.5) return "high";
  if (input.reviewCount < 3) return "medium";
  return "low";
}

/** Higher = better perceived value (nightly $ per sleeping capacity). */
export function computeBnhubValueScore(input: {
  nightPriceCents: number;
  beds?: number | null;
  maxGuests?: number | null;
}): number {
  const price = Math.max(1, input.nightPriceCents / 100);
  const capacity = Math.max(1, input.beds ?? 1, Math.ceil((input.maxGuests ?? 2) / 2));
  return capacity / price;
}

export function valueLabelFromScore(score: number, medianPeerScore = 0.04): "Best value" | "Great price" | null {
  if (score >= medianPeerScore * 1.35) return "Best value";
  if (score >= medianPeerScore * 1.12) return "Great price";
  return null;
}

export function annotateBnhubListingsForGuest<
  T extends {
    nightPriceCents: number;
    beds?: number | null;
    maxGuests?: number | null;
    verificationStatus?: string | null;
    reviews?: { propertyRating: number }[];
    _count?: { reviews?: number };
    operationalRiskScore?: number | null;
    /** Denormalized card aggregates when `reviews` are not loaded (e.g. homepage). */
    bnhubListingRatingAverage?: number | null;
    bnhubListingReviewCount?: number;
  },
>(listings: T[]): Array<T & BnhubGuestListingAnnotations> {
  const scores = listings.map((l) => computeBnhubValueScore(l));
  const median = scores.length ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] ?? 0.04 : 0.04;

  return listings.map((l, i) => {
    const reviewSamples = l.reviews ?? [];
    const countFromRelation = l._count?.reviews ?? reviewSamples.length;
    const reviewCount =
      countFromRelation > 0
        ? countFromRelation
        : typeof l.bnhubListingReviewCount === "number"
          ? l.bnhubListingReviewCount
          : 0;
    const avgRating =
      reviewSamples.length > 0
        ? reviewSamples.reduce((s, r) => s + r.propertyRating, 0) / reviewSamples.length
        : (l.bnhubListingRatingAverage ?? null);
    const verified = l.verificationStatus === "VERIFIED";
    const riskLevel = computeBnhubTrustRiskLevel({
      verificationStatus: l.verificationStatus,
      reviewCount,
      avgRating,
      operationalRiskScore: l.operationalRiskScore ?? null,
    });
    const valueScore = scores[i] ?? computeBnhubValueScore(l);
    const valueLabel = valueLabelFromScore(valueScore, median);
    const fraud = assessBnhubListingFraudHeuristic({
      nightPriceCents: l.nightPriceCents,
      reviewCount,
      avgRating,
    });
    return {
      ...l,
      riskLevel,
      valueScore,
      valueLabel,
      fraud,
      verified,
      displayRating: avgRating,
      displayReviewCount: reviewCount,
    };
  });
}

/** Guest-first ordering: value, then lower trust risk, then verification. */
export function sortBnhubListingsByGuestAppeal<T extends BnhubGuestListingAnnotations>(listings: T[]): T[] {
  const riskOrder: Record<BnhubListingRiskLevel, number> = { low: 0, medium: 1, high: 2 };
  return [...listings].sort((a, b) => {
    if (Math.abs(b.valueScore - a.valueScore) > 1e-6) return b.valueScore - a.valueScore;
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
  });
}

/** Host dashboard tips — avoids duplicating listing-quality issues (shown separately). */
export function bnhubHostGrowthTips(input: {
  suggestedPriceDeltaPercent: number;
  priceRationale: string;
  occLow: number;
  occHigh: number;
  occNote: string;
}): string[] {
  const tips: string[] = [];
  if (input.suggestedPriceDeltaPercent !== 0) {
    tips.push(input.priceRationale);
  }
  tips.push(`Occupancy band (model): ${input.occLow}%–${input.occHigh}%. ${input.occNote}`);
  const promo = bnhubAutopilotPromotionIdeas()[0];
  if (promo) tips.push(promo);
  if (tips.length === 1) {
    tips.push("Aim for sub-hour replies on booking inquiries during peak windows.");
  }
  return tips;
}

/** Basic signals only — escalate via admin trust tools when `watch`. */
export function assessBnhubListingFraudHeuristic(input: {
  nightPriceCents: number;
  reviewCount: number;
  avgRating?: number | null;
  accountAgeDays?: number | null;
}): BnhubFraudHeuristic {
  if (input.nightPriceCents > 0 && input.nightPriceCents < 1500) {
    return { level: "watch", reason: "Unusually low nightly rate — verify photos and host profile." };
  }
  if (input.reviewCount >= 8 && input.avgRating != null && input.avgRating >= 4.98) {
    return { level: "watch", reason: "Very high rating density — reviews are spot-checked by trust ops." };
  }
  if (input.accountAgeDays != null && input.accountAgeDays < 3 && input.reviewCount > 5) {
    return { level: "watch", reason: "New host with many reviews — automated review authenticity checks apply." };
  }
  return { level: "ok" };
}

export function assessBnhubReviewFraudHeuristic(input: {
  rating: number;
  textLength: number;
  sameDayBatchCount?: number;
}): BnhubFraudHeuristic {
  if (input.rating >= 5 && input.textLength < 8) {
    return { level: "watch", reason: "Five-star review with almost no text — may be low-signal." };
  }
  if ((input.sameDayBatchCount ?? 0) >= 4) {
    return { level: "watch", reason: "Multiple same-day reviews from similar sources — flagged for review." };
  }
  return { level: "ok" };
}

export function analyzeBnhubListingContentQuality(input: {
  photoCount: number;
  description?: string | null;
  amenitiesCount: number;
}): BnhubListingQualityReport {
  const issues: string[] = [];
  if (input.photoCount < MIN_PHOTOS) {
    issues.push("Add more photos — guests book when they can see the full space.");
  }
  if (!input.description || input.description.trim().length < MIN_DESCRIPTION_CHARS) {
    issues.push("Your listing can be improved — expand the description with highlights and house rules.");
  }
  if (input.amenitiesCount < MIN_AMENITIES) {
    issues.push("List core amenities (Wi‑Fi, kitchen, parking) to match guest filters.");
  }
  return {
    ok: issues.length === 0,
    issues,
    headline: issues.length ? "Your listing can be improved" : "Listing looks strong",
  };
}

export function suggestBnhubNightlyPriceDeltaPercent(input: {
  nightPriceCents: number;
  completedStays: number;
  reviewAverage?: number | null;
}): { suggestedDeltaPercent: number; rationale: string } {
  let delta = 0;
  const nights = input.nightPriceCents / 100;
  if (input.completedStays >= 6 && (input.reviewAverage ?? 0) >= 4.7) {
    delta = 5;
  } else if (input.completedStays <= 1) {
    delta = -3;
  }
  const rationale =
    delta > 0
      ? "Strong reviews and stay history — consider a small premium (not auto-applied)."
      : delta < 0
        ? "Early traction — a modest discount can lift occupancy (suggestion only)."
        : "Hold price — gather more completed stays before changing rates.";
  return { suggestedDeltaPercent: delta, rationale };
}

export function predictBnhubOccupancyBand(input: {
  completedStaysLast90Days: number;
  reviewAverage?: number | null;
}): { lowPct: number; highPct: number; note: string } {
  const base = 38 + Math.min(28, input.completedStaysLast90Days * 2) + ((input.reviewAverage ?? 4.2) - 4) * 8;
  const low = Math.max(22, Math.min(72, Math.round(base - 8)));
  const high = Math.max(low + 5, Math.min(85, Math.round(base + 10)));
  return {
    lowPct: low,
    highPct: high,
    note: "Illustrative 30-day occupancy band from on-platform signals — not a guarantee.",
  };
}

export function bnhubAutopilotMessageSuggestions(): string[] {
  return [
    "Thanks for booking — check-in is at {time}. Wi‑Fi and parking details are in the listing.",
    "Hi {guest}, happy to help with local tips. Quiet hours after 10pm — appreciate your care for neighbors.",
    "Your checkout is {date}. Let us know if you need a late checkout and we’ll try to accommodate.",
  ];
}

export function bnhubAutopilotPromotionIdeas(): string[] {
  return [
    "Boost the lead photo with daylight shots of the main living area.",
    "Enable instant book for verified guests to reduce drop-off (when you’re comfortable).",
    "Run a 3-night minimum on weekends if cleaning turnover is tight — protects margin.",
  ];
}
