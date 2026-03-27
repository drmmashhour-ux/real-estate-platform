/**
 * AI-powered search ranking for BNHub.
 * Scores listings by price competitiveness, location popularity, match quality,
 * recency, and booking probability; assigns labels for UI.
 */

export type BnhubSearchFilters = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
};

export type BnhubSearchUserContext = {
  /** Optional: preferred price range for personalization */
  preferredMaxPrice?: number;
};

/** Listing shape expected by rankListings (matches search API response). */
export type BnhubListingForRanking = {
  id: string;
  title?: string;
  listingCode?: string | null;
  city?: string;
  nightPriceCents: number;
  maxGuests?: number;
  beds?: number;
  baths?: number;
  propertyType?: string | null;
  roomType?: string | null;
  photos?: unknown;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string | Date;
  verificationStatus?: string;
  _count?: { reviews?: number; bookings?: number };
  reviews?: { propertyRating?: number }[];
};

export type BnhubListingLabel = "Best Match" | "Great Price" | "High Demand";

export type RankedBnhubListing<T extends BnhubListingForRanking = BnhubListingForRanking> = T & {
  _aiScore: number;
  _aiLabels: BnhubListingLabel[];
};

const LABEL_BEST_MATCH: BnhubListingLabel = "Best Match";
const LABEL_GREAT_PRICE: BnhubListingLabel = "Great Price";
const LABEL_HIGH_DEMAND: BnhubListingLabel = "High Demand";

/** Weight for each score component (tune as needed). */
const WEIGHTS = {
  priceCompetitiveness: 25,
  locationPopularity: 15,
  availabilityMatch: 20,
  guestCapacityMatch: 15,
  recency: 10,
  bookingProbability: 15,
};

/**
 * Normalize location string for comparison (lowercase, trim).
 */
function normalizeLocation(s: string | undefined): string {
  if (!s || typeof s !== "string") return "";
  return s.trim().toLowerCase();
}

/**
 * Check if listing location matches filter (exact or contains).
 */
function locationMatches(
  listingCity: string | undefined,
  filterLocation: string | undefined
): "exact" | "partial" | "none" {
  if (!filterLocation?.trim()) return "partial";
  const a = normalizeLocation(listingCity);
  const b = normalizeLocation(filterLocation);
  if (!a) return "none";
  if (a === b) return "exact";
  if (a.includes(b) || b.includes(a)) return "partial";
  return "none";
}

/**
 * Guest capacity match: exact = high, meets = medium, else low.
 */
function guestMatch(listingGuests: number | undefined, filterGuests: number | undefined): number {
  if (filterGuests == null || filterGuests <= 0) return 1;
  const max = listingGuests ?? 0;
  if (max <= 0) return 0.5;
  if (max === filterGuests) return 1;
  if (max >= filterGuests) return 0.85;
  return 0.2;
}

/**
 * Recency score: newer listings get a boost (0–1).
 * Uses createdAt if present, else 0.5.
 */
function recencyScore(createdAt: string | Date | undefined): number {
  if (createdAt == null) return 0.5;
  const t = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  if (Number.isNaN(t)) return 0.5;
  const now = Date.now();
  const ageDays = (now - t) / (24 * 60 * 60 * 1000);
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.9;
  if (ageDays <= 90) return 0.7;
  if (ageDays <= 365) return 0.5;
  return 0.3;
}

/**
 * Booking probability proxy: more bookings + reviews = higher score (0–1).
 */
function bookingProbabilityScore(listing: BnhubListingForRanking): number {
  const bookings = listing._count?.bookings ?? 0;
  const reviews = listing._count?.reviews ?? listing.reviews?.length ?? 0;
  const total = bookings + reviews;
  if (total <= 0) return 0.3;
  if (total <= 2) return 0.5;
  if (total <= 5) return 0.7;
  if (total <= 15) return 0.85;
  return 1;
}

/**
 * Price competitiveness: below market avg = bonus, far above = penalty.
 * marketAvgCents is computed from the current result set (no external data).
 */
function priceScore(
  listingPriceCents: number,
  marketAvgCents: number,
  filterMaxPrice?: number
): number {
  const listingPrice = listingPriceCents / 100;
  const marketAvg = marketAvgCents / 100;
  if (marketAvg <= 0) return 1;

  const ratio = listingPrice / marketAvg;
  // Below market = good
  if (ratio <= 0.85) return 1;
  if (ratio <= 1) return 0.9;
  // Above market = gradual penalty
  if (ratio <= 1.2) return 0.7;
  if (ratio <= 1.5) return 0.4;
  return 0.2;
}

/**
 * Location popularity: if filter has location, exact match gets full score;
 * partial gets medium; no filter = neutral.
 */
function locationScore(
  listingCity: string | undefined,
  filterLocation: string | undefined
): number {
  const match = locationMatches(listingCity, filterLocation);
  if (match === "exact") return 1;
  if (match === "partial") return 0.6;
  return 0.5;
}

/**
 * Availability match: when checkIn/checkOut are provided, we assume the list
 * is already filtered by availability (API does that). So if filters have dates,
 * treat as full match; else neutral.
 */
function availabilityMatchScore(filters: BnhubSearchFilters): number {
  if (filters.checkIn && filters.checkOut) return 1;
  return 0.7;
}

/**
 * Compute total score for one listing and determine labels.
 */
function scoreListing(
  listing: BnhubListingForRanking,
  filters: BnhubSearchFilters,
  userContext: BnhubSearchUserContext | undefined,
  marketAvgCents: number
): { score: number; labels: BnhubListingLabel[] } {
  const priceCents = listing.nightPriceCents ?? 0;
  const priceComp = priceScore(
    priceCents,
    marketAvgCents,
    filters.maxPrice != null ? filters.maxPrice * 100 : userContext?.preferredMaxPrice
  );
  const locPop = locationScore(listing.city, filters.location);
  const availMatch = availabilityMatchScore(filters);
  const guestCap = guestMatch(listing.maxGuests, filters.guests);
  const recency = recencyScore(listing.createdAt);
  const bookingProb = bookingProbabilityScore(listing);

  const score =
    priceComp * WEIGHTS.priceCompetitiveness +
    locPop * WEIGHTS.locationPopularity +
    availMatch * WEIGHTS.availabilityMatch +
    guestCap * WEIGHTS.guestCapacityMatch +
    recency * WEIGHTS.recency +
    bookingProb * WEIGHTS.bookingProbability;

  const labels: BnhubListingLabel[] = [];
  const exactLocation = locationMatches(listing.city, filters.location) === "exact";
  const hasDates = Boolean(filters.checkIn && filters.checkOut);
  const guestFit = guestCap >= 0.85;
  if (exactLocation && hasDates && guestFit) labels.push(LABEL_BEST_MATCH);
  if (priceComp >= 0.95 && (listing.nightPriceCents ?? 0) / 100 <= (marketAvgCents / 100) * 0.9)
    labels.push(LABEL_GREAT_PRICE);
  if (bookingProb >= 0.7) labels.push(LABEL_HIGH_DEMAND);

  return { score, labels };
}

/**
 * Rank listings by AI score and attach labels.
 * After filtering, pass the result here; this sorts by score DESC and adds
 * _aiScore and _aiLabels to each listing.
 */
export function rankListings<T extends BnhubListingForRanking>(
  listings: T[],
  filters: BnhubSearchFilters,
  userContext?: BnhubSearchUserContext
): RankedBnhubListing<T>[] {
  if (listings.length === 0) return [];

  const marketAvgCents =
    listings.reduce((sum, l) => sum + (l.nightPriceCents ?? 0), 0) / listings.length;

  const scored: RankedBnhubListing<T>[] = listings.map((listing) => {
    const { score, labels } = scoreListing(listing, filters, userContext, marketAvgCents);
    return {
      ...listing,
      _aiScore: Math.round(score * 100) / 100,
      _aiLabels: labels,
    };
  });

  scored.sort((a, b) => b._aiScore - a._aiScore);
  return scored;
}
