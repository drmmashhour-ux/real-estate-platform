import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import {
  listPublicBnhubListingsFiltered,
  type PublicListingRow,
} from "@/lib/bnhub/public-supabase-listings-read";
import { parseNaturalLanguageQuery } from "@/lib/search/natural-language-parse";
import { rankListingsForQuery, type RankedListing } from "@/lib/search/rank-listings";

async function loadReviewStatsForListings(
  listingIds: string[]
): Promise<Map<string, { avg: number; count: number }>> {
  const map = new Map<string, { avg: number; count: number }>();
  if (listingIds.length === 0) return map;
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) return map;

  const { data, error } = await sb.from("reviews").select("listing_id, rating").in("listing_id", listingIds);
  if (error || !data) return map;

  const byListing = new Map<string, number[]>();
  for (const row of data as { listing_id: string; rating: number }[]) {
    const arr = byListing.get(row.listing_id) ?? [];
    arr.push(row.rating);
    byListing.set(row.listing_id, arr);
  }
  for (const [id, ratings] of byListing) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    map.set(id, { avg: sum / ratings.length, count: ratings.length });
  }
  return map;
}

export type AiSearchResult = {
  parsed: ReturnType<typeof parseNaturalLanguageQuery>;
  results: RankedListing[];
};

/**
 * Platform-owned AI search: parse → filtered list → rank (reviews batched when possible).
 */
export async function runAiListingSearch(query: string): Promise<
  { ok: true; data: AiSearchResult } | { ok: false; status: number; error: string }
> {
  const parsed = parseNaturalLanguageQuery(query);
  const listRes = await listPublicBnhubListingsFiltered({
    q: parsed.city ?? parsed.queryText,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
  });

  if (!listRes.ok) {
    return { ok: false, status: listRes.status, error: listRes.error };
  }

  let pool: PublicListingRow[] = listRes.listings;

  if (parsed.city) {
    const c = parsed.city.toLowerCase();
    const filtered = pool.filter((L) => (L.city ?? "").toLowerCase().includes(c));
    if (filtered.length > 0) pool = filtered;
  }

  const ids = pool.map((p) => p.id);
  const reviewMap = await loadReviewStatsForListings(ids);
  const ranked = rankListingsForQuery(pool, parsed, reviewMap);

  return { ok: true, data: { parsed, results: ranked.slice(0, 40) } };
}
