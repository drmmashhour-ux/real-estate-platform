/**
 * Guest stay recommendations — transparent scoring, computed badges only (no fake urgency).
 */
import type { GuestContext, GuestTripPreference } from "./context.types";

export type GuestRecommendableListing = {
  id: string;
  city: string;
  region?: string | null;
  nightPriceCents: number;
  maxGuests: number;
  beds: number;
  baths: number;
  propertyType?: string | null;
  roomType?: string | null;
  amenities?: unknown;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  noiseLevel?: string | null;
  reviews?: { propertyRating?: number }[];
  _count?: { reviews?: number; bookings?: number };
  availableForRequestedDates?: boolean;
  qualityBadgeLabel?: string | null;
};

export type GuestTrustLabel = {
  key: "popular_choice" | "best_value" | "good_match";
  label: string;
  /** Plain-language justification (safe to show in UI tooltips) */
  evidence: string;
};

export type GuestListingRecommendation = {
  listingId: string;
  matchPercent: number;
  /** Subscores 0–100 for transparency */
  scoreBreakdown: {
    priceMatch: number;
    locationRelevance: number;
    rating: number;
    amenitiesMatch: number;
    pastBehavior: number;
    personalizationBoost: number;
  };
  why: string[];
  labels: GuestTrustLabel[];
};

export type GuestRecommendationResult = {
  ranked: GuestListingRecommendation[];
};

const WEIGHTS = {
  priceMatch: 0.22,
  location: 0.22,
  rating: 0.18,
  amenities: 0.18,
  behavior: 0.2,
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function normCity(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function listingReviewAvg(listing: GuestRecommendableListing): { avg: number; count: number } {
  const count = listing._count?.reviews ?? listing.reviews?.length ?? 0;
  const raw = listing.reviews?.[0]?.propertyRating;
  const n = typeof raw === "number" ? raw : raw != null ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0 && count > 0) return { avg: clamp(n, 1, 5), count };
  return { avg: 3.9, count: 0 };
}

function amenitiesStrings(listing: GuestRecommendableListing): string[] {
  const a = listing.amenities;
  if (!Array.isArray(a)) return [];
  return a.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
}

function preferenceAmenityHints(prefs: GuestTripPreference[] | undefined): string[] {
  if (!prefs?.length) return [];
  const out = new Set<string>();
  for (const p of prefs) {
    if (p === "luxury") {
      ["wifi", "kitchen", "parking", "air", "conditioning", "washer"].forEach((x) => out.add(x));
    }
    if (p === "family") {
      ["kitchen", "washer", "parking", "crib"].forEach((x) => out.add(x));
    }
    if (p === "business") {
      ["wifi", "workspace", "desk", "kitchen"].forEach((x) => out.add(x));
    }
    if (p === "budget") {
      /* price handled elsewhere */
    }
    if (p === "pet_friendly") {
      out.add("pet");
    }
    if (p === "quiet") {
      /* noise preference checked on listing field */
    }
  }
  return [...out];
}

function scorePriceMatch(listing: GuestRecommendableListing, ctx: GuestContext): { score: number; note?: string } {
  const night = listing.nightPriceCents / 100;
  if (!(night > 0)) return { score: 50 };

  const min = ctx.budgetRange?.min;
  const max = ctx.budgetRange?.max;
  if (min != null && max != null && max >= min) {
    if (night >= min && night <= max) {
      return { score: 95, note: "Nightly rate fits your budget range." };
    }
    if (night < min) {
      return { score: 72, note: "Priced below your minimum — still shown in case you want flexibility." };
    }
    const over = (night - max) / Math.max(max, 1);
    const s = clamp(90 - over * 120, 15, 88);
    return { score: s, note: over > 0.15 ? "Above your stated maximum nightly rate." : "Slightly above your maximum nightly rate." };
  }
  if (max != null && max > 0) {
    if (night <= max) return { score: 92, note: "At or under your maximum nightly price." };
    const over = (night - max) / max;
    return {
      score: clamp(85 - over * 100, 20, 84),
      note: "Above your maximum nightly price.",
    };
  }
  return { score: 70 };
}

function scoreLocation(listing: GuestRecommendableListing, ctx: GuestContext): { score: number; note?: string } {
  const q = normCity(ctx.location);
  if (!q) return { score: 65 };
  const c = normCity(listing.city);
  const r = normCity(listing.region);
  if (c === q || r === q) return { score: 100, note: `Location matches ${listing.city}.` };
  if (c.includes(q) || q.includes(c)) return { score: 88, note: `Nearby or overlapping area with ${listing.city}.` };
  return { score: 35, note: "Different area than your current search location." };
}

function scoreRating(listing: GuestRecommendableListing): { score: number; note?: string } {
  const { avg, count } = listingReviewAvg(listing);
  const stars01 = (avg - 1) / 4;
  let s = 40 + stars01 * 60;
  if (count === 0) {
    s = 58;
    return { score: s, note: "No guest reviews yet — neutral score." };
  }
  if (count < 3) {
    s -= 6;
    return { score: s, note: "Few reviews so far — rating weighted gently." };
  }
  return { score: s, note: `Guest rating ~${avg.toFixed(1)}/5 from ${count} reviews.` };
}

function scoreAmenities(listing: GuestRecommendableListing, ctx: GuestContext): { score: number; note?: string } {
  const hints = preferenceAmenityHints(ctx.preferences);
  const am = amenitiesStrings(listing);
  if (hints.length === 0) {
    return { score: 68 };
  }
  if (am.length === 0) {
    return { score: 45, note: "Amenity list is sparse — match is uncertain." };
  }
  let hit = 0;
  for (const h of hints) {
    if (am.some((s) => s.includes(h))) hit += 1;
  }
  const ratio = hit / hints.length;
  const prefs = ctx.preferences ?? [];
  let bonus = 0;
  if (prefs.includes("pet_friendly") && listing.petsAllowed) bonus += 0.12;
  if (prefs.includes("family") && listing.familyFriendly) bonus += 0.1;
  if (prefs.includes("quiet") && listing.noiseLevel?.toLowerCase() === "quiet") bonus += 0.12;
  if (prefs.includes("luxury") && listing.qualityBadgeLabel) bonus += 0.08;

  const s = clamp((ratio + bonus) * 100, 25, 100);
  const note =
    ratio >= 0.5
      ? "Several of your amenity preferences appear in this listing."
      : "Limited overlap with your amenity preferences.";
  return { score: s, note };
}

function viewedCityPriceProfile(ctx: GuestContext, listingsById: Map<string, GuestRecommendableListing>): {
  cities: Set<string>;
  medianPrice: number | null;
  propertyTypes: Map<string, number>;
} {
  const cities = new Set<string>();
  const prices: number[] = [];
  const ptCount = new Map<string, number>();
  for (const id of ctx.behaviorSignals.viewedListingIds) {
    const l = listingsById.get(id);
    if (!l) continue;
    cities.add(normCity(l.city));
    if (l.nightPriceCents > 0) prices.push(l.nightPriceCents);
    const pt = (l.propertyType ?? "").trim();
    if (pt) ptCount.set(pt, (ptCount.get(pt) ?? 0) + 1);
  }
  prices.sort((a, b) => a - b);
  const mid = prices.length ? prices[Math.floor(prices.length / 2)]! : null;
  return { cities, medianPrice: mid, propertyTypes: ptCount };
}

function scoreBehavior(
  listing: GuestRecommendableListing,
  ctx: GuestContext,
  profile: ReturnType<typeof viewedCityPriceProfile>
): { score: number; notes: string[] } {
  const notes: string[] = [];
  let s = 42;
  const { viewedListingIds, likedListingIds, bookingHistory } = ctx.behaviorSignals;

  if (likedListingIds.includes(listing.id)) {
    s += 28;
    notes.push("You saved this listing before.");
  } else if (viewedListingIds.includes(listing.id)) {
    s += 18;
    notes.push("You recently viewed this listing.");
  }

  const bookCities = new Set(bookingHistory.map((b) => normCity(b.city)).filter(Boolean));
  if (bookCities.has(normCity(listing.city))) {
    s += 14;
    notes.push("Same city as a past stay.");
  }

  if (profile.cities.has(normCity(listing.city)) && !notes.some((n) => n.includes("viewed"))) {
    s += 10;
    notes.push("Same area as other listings you browsed.");
  }

  return { score: clamp(s, 30, 100), notes };
}

function personalizationBoost(
  listing: GuestRecommendableListing,
  ctx: GuestContext,
  profile: ReturnType<typeof viewedCityPriceProfile>
): { score: number; notes: string[] } {
  const notes: string[] = [];
  let add = 0;
  if (profile.medianPrice != null && listing.nightPriceCents > 0) {
    const lo = profile.medianPrice * 0.78;
    const hi = profile.medianPrice * 1.22;
    if (listing.nightPriceCents >= lo && listing.nightPriceCents <= hi) {
      add += 12;
      notes.push("Nightly price is close to places you already explored.");
    }
  }
  if (profile.propertyTypes.size > 0 && listing.propertyType) {
    const top = [...profile.propertyTypes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (top && listing.propertyType === top) {
      add += 8;
      notes.push(`Same property type as listings you viewed (${top}).`);
    }
  }
  return { score: clamp(add, 0, 35), notes };
}

function cohortBookingStats(listings: GuestRecommendableListing[]): {
  medianBookings: number;
  p75Bookings: number;
  medianPrice: number;
  valueScores: number[];
} {
  const bookings = listings.map((l) => l._count?.bookings ?? 0).sort((a, b) => a - b);
  const prices = listings
    .map((l) => l.nightPriceCents)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);
  const mid = (arr: number[]) => (arr.length ? arr[Math.floor(arr.length / 2)]! : 0);
  const p75 = (arr: number[]) => (arr.length ? arr[Math.floor(arr.length * 0.75)]! : 0);
  const medianBookings = mid(bookings);
  const p75Bookings = p75(bookings);
  const medianPrice = mid(prices) || 1;
  const valueScores = listings.map((l) => {
    const { avg, count } = listingReviewAvg(l);
    if (count < 3 || l.nightPriceCents <= 0) return 0;
    const price = l.nightPriceCents / 100;
    return avg / Math.max(price / (medianPrice / 100), 0.01);
  });
  return { medianBookings, p75Bookings, medianPrice, valueScores };
}

function computeLabels(
  listing: GuestRecommendableListing,
  rec: GuestListingRecommendation,
  cohort: ReturnType<typeof cohortBookingStats>,
  allValueScores: { id: string; score: number }[],
  hasPersonalizationSignal: boolean
): GuestTrustLabel[] {
  const labels: GuestTrustLabel[] = [];
  const bookings = listing._count?.bookings ?? 0;
  const { avg, count } = listingReviewAvg(listing);
  const price = listing.nightPriceCents / 100;
  const medianCad = cohort.medianPrice / 100;

  const popularThreshold =
    cohort.medianBookings >= 3
      ? Math.max(3, cohort.p75Bookings)
      : Math.max(5, Math.ceil(cohort.medianBookings * 1.5) || 5);

  if (bookings >= popularThreshold && bookings >= 3) {
    labels.push({
      key: "popular_choice",
      label: "Popular choice",
      evidence: `Based on completed stays on our platform (${bookings} in this cohort). Not time-limited.`,
    });
  }

  if (count >= 3 && avg >= 4.4 && price > 0 && medianCad > 0 && price <= medianCad * 1.08 && avg >= 4.5) {
    labels.push({
      key: "best_value",
      label: "Best value",
      evidence: `Strong guest rating (${avg.toFixed(1)}/5) with nightly price at or below the typical search result.`,
    });
  } else if (allValueScores.length >= 4) {
    const sorted = [...allValueScores].sort((a, b) => b.score - a.score);
    const topQ = sorted[Math.max(0, Math.floor(sorted.length * 0.25) - 1)]?.score ?? 0;
    const mine = allValueScores.find((x) => x.id === listing.id)?.score ?? 0;
    if (mine > 0 && mine >= topQ && count >= 3) {
      labels.push({
        key: "best_value",
        label: "Best value",
        evidence: "Strong rating relative to nightly price compared with similar results in this search.",
      });
    }
  }

  const behaviorSlice = rec.scoreBreakdown.pastBehavior + rec.scoreBreakdown.personalizationBoost;
  if (
    hasPersonalizationSignal &&
    rec.matchPercent >= 72 &&
    behaviorSlice >= 52
  ) {
    labels.push({
      key: "good_match",
      label: "Good match for you",
      evidence: "Based on your filters, budget, and recent browsing or saved stays — not a guarantee of availability.",
    });
  }

  return labels;
}

/**
 * Rank and score listings for the given guest context. O(n) over listings; safe for interactive search.
 */
export function getRecommendedListings(
  context: GuestContext,
  listings: GuestRecommendableListing[]
): GuestRecommendationResult {
  if (listings.length === 0) return { ranked: [] };

  const listingsById = new Map(listings.map((l) => [l.id, l]));
  const profile = viewedCityPriceProfile(context, listingsById);
  const cohort = cohortBookingStats(listings);

  const valueRank = listings.map((l) => {
    const { avg, count } = listingReviewAvg(l);
    if (count < 3 || l.nightPriceCents <= 0) return { id: l.id, score: 0 };
    const price = l.nightPriceCents / 100;
    return { id: l.id, score: avg / Math.max(price / (cohort.medianPrice / 100), 0.01) };
  });

  const hasPersonalizationSignal =
    (context.preferences?.length ?? 0) > 0 ||
    context.behaviorSignals.viewedListingIds.length > 0 ||
    context.behaviorSignals.likedListingIds.length > 0 ||
    context.behaviorSignals.bookingHistory.length > 0;

  const ranked: GuestListingRecommendation[] = [];

  for (const listing of listings) {
    const p = scorePriceMatch(listing, context);
    const loc = scoreLocation(listing, context);
    const r = scoreRating(listing);
    const am = scoreAmenities(listing, context);
    const beh = scoreBehavior(listing, context, profile);
    const pers = personalizationBoost(listing, context, profile);

    const weighted =
      p.score * WEIGHTS.priceMatch +
      loc.score * WEIGHTS.location +
      r.score * WEIGHTS.rating +
      am.score * WEIGHTS.amenities +
      beh.score * WEIGHTS.behavior;

    const matchPercent = Math.round(
      clamp(weighted * 0.82 + pers.score * 0.55 + (listing.availableForRequestedDates === false ? -6 : 0), 38, 99)
    );

    const why = [p.note, loc.note, r.note, am.note, ...beh.notes, ...pers.notes].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    );

    const scoreBreakdown = {
      priceMatch: Math.round(p.score),
      locationRelevance: Math.round(loc.score),
      rating: Math.round(r.score),
      amenitiesMatch: Math.round(am.score),
      pastBehavior: Math.round(beh.score),
      personalizationBoost: Math.round(pers.score),
    };

    const base: GuestListingRecommendation = {
      listingId: listing.id,
      matchPercent,
      scoreBreakdown,
      why: [...new Set(why)].slice(0, 6),
      labels: [],
    };

    base.labels = computeLabels(listing, base, cohort, valueRank, hasPersonalizationSignal);

    ranked.push(base);
  }

  ranked.sort((a, b) => b.matchPercent - a.matchPercent);
  return { ranked };
}

export function mergeGuestScoresIntoListings<T extends GuestRecommendableListing>(
  listings: T[],
  result: GuestRecommendationResult,
  opts?: { reorder?: boolean }
): T[] {
  const byId = new Map(result.ranked.map((r) => [r.listingId, r]));
  const enriched = listings.map((l) => {
    const r = byId.get(l.id);
    if (!r) {
      return {
        ...l,
        guestMatchPercent: undefined,
        guestMatchBreakdown: undefined,
        guestMatchReasons: undefined,
        guestTrustLabels: undefined,
      };
    }
    return {
      ...l,
      guestMatchPercent: r.matchPercent,
      guestMatchBreakdown: r.scoreBreakdown,
      guestMatchReasons: r.why,
      guestTrustLabels: r.labels,
    };
  });
  if (!opts?.reorder) return enriched;
  return [...enriched].sort((a, b) => (b.guestMatchPercent ?? 0) - (a.guestMatchPercent ?? 0));
}
