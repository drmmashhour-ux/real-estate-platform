/**
 * Basic relevance scoring for GET /api/listings (BNHUB search results).
 * Sorts by score when filters help ranking; falls back to rating + balanced price when none.
 */

export type ListingSearchRelevanceRow = {
  title: string;
  city: string;
  country: string;
  nightPriceCents: number;
  description?: string | null;
  photos: unknown;
  amenities: unknown;
  reviews: { propertyRating: number }[];
};

export type SearchRelevanceQuery = {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
};

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

function cityMatches(listingCity: string, selected: string | undefined): boolean {
  const a = norm(listingCity);
  const b = norm(selected);
  if (!b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function countryMatches(listingCountry: string, selected: string | undefined): boolean {
  const a = norm(listingCountry);
  const b = norm(selected);
  if (!b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function nightlyUsd(nightPriceCents: number): number {
  return nightPriceCents / 100;
}

function priceWithinUserRange(
  nightPriceCents: number,
  minPrice?: number,
  maxPrice?: number
): boolean | null {
  const hasMin = minPrice != null && Number.isFinite(minPrice);
  const hasMax = maxPrice != null && Number.isFinite(maxPrice);
  if (!hasMin && !hasMax) return null;
  const usd = nightlyUsd(nightPriceCents);
  if (hasMin && usd < minPrice!) return false;
  if (hasMax && usd > maxPrice!) return false;
  return true;
}

function hasListingImages(l: ListingSearchRelevanceRow): boolean {
  const p = l.photos;
  if (Array.isArray(p) && p.some((x) => typeof x === "string" && x.trim().length > 0)) return true;
  const lp = (l as { listingPhotos?: { url?: string }[] }).listingPhotos;
  return Array.isArray(lp) && lp.some((x) => typeof x?.url === "string" && x.url.length > 0);
}

function hasAmenities(l: ListingSearchRelevanceRow): boolean {
  const a = l.amenities;
  return Array.isArray(a) && a.length > 0;
}

function hasDescription(l: ListingSearchRelevanceRow): boolean {
  return typeof l.description === "string" && l.description.trim().length > 20;
}

function ratingValue(l: ListingSearchRelevanceRow): number {
  const r = l.reviews?.[0]?.propertyRating;
  return typeof r === "number" && Number.isFinite(r) ? r : 0;
}

/**
 * Spec: location, price range, stars, completeness.
 */
export function computeListingSearchScore(
  listing: ListingSearchRelevanceRow,
  q: SearchRelevanceQuery
): number {
  let score = 0;

  if (cityMatches(listing.city, q.city)) {
    score += 50;
  }
  if (countryMatches(listing.country, q.country)) {
    score += 20;
  }

  const inRange = priceWithinUserRange(listing.nightPriceCents, q.minPrice, q.maxPrice);
  if (inRange === true) {
    score += 30;
  } else if (inRange === false) {
    score -= 20;
  }

  const stars = ratingValue(listing);
  if (stars >= 4.5) {
    score += 20;
  } else if (stars >= 4) {
    score += 10;
  }

  if (hasListingImages(listing) && hasDescription(listing) && hasAmenities(listing)) {
    score += 10;
  }

  return score;
}

function hasAnyRelevanceFilter(q: SearchRelevanceQuery): boolean {
  return Boolean(
    norm(q.city) ||
      norm(q.country) ||
      (q.minPrice != null && Number.isFinite(q.minPrice)) ||
      (q.maxPrice != null && Number.isFinite(q.maxPrice))
  );
}

/** Median night price (cents) for “balanced” price tie-break. */
function medianNightPriceCents(listings: ListingSearchRelevanceRow[]): number {
  if (listings.length === 0) return 0;
  const sorted = [...listings].map((l) => l.nightPriceCents).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid] ?? 0;
}

/**
 * No city/country/price filters: sort by rating desc, then closeness to median nightly price.
 */
export function sortListingsFallbackBalanced<T extends ListingSearchRelevanceRow>(listings: T[]): T[] {
  if (listings.length <= 1) return [...listings];
  const median = medianNightPriceCents(listings);
  return [...listings].sort((a, b) => {
    const ra = ratingValue(a);
    const rb = ratingValue(b);
    if (rb !== ra) return rb - ra;
    const da = Math.abs(a.nightPriceCents - median);
    const db = Math.abs(b.nightPriceCents - median);
    if (da !== db) return da - db;
    return b.nightPriceCents - a.nightPriceCents;
  });
}

export function sortListingsBySearchRelevance<T extends ListingSearchRelevanceRow>(
  listings: T[],
  q: SearchRelevanceQuery
): T[] {
  if (listings.length <= 1) return [...listings];

  if (!hasAnyRelevanceFilter(q)) {
    return sortListingsFallbackBalanced(listings);
  }

  const scored = listings.map((l) => ({
    listing: l,
    score: computeListingSearchScore(l, q),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.listing);
}

export function logSearchRelevanceDebug(
  listings: ListingSearchRelevanceRow[],
  q: SearchRelevanceQuery
): void {
  if (process.env.NODE_ENV !== "development") return;
  for (const l of listings) {
    const score = computeListingSearchScore(l, q);
    console.log({ listing: l.title, score });
  }
}
