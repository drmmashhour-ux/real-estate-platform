import "server-only";

import { query } from "@/lib/sql";
import { boostListingsByPreferredCities, sortCitiesByPreferred, type SuggestListingRow } from "@/lib/search/suggestBoost";

export type { SuggestListingRow } from "@/lib/search/suggestBoost";

export type SearchSuggestResult = {
  cities: string[];
  listings: SuggestListingRow[];
};

const LISTING_CAP = 15;
const MAX_CITIES = 5;

/**
 * Suggested cities + stay listings (BNHub) for the smart search bar. No external APIs.
 */
export async function getSearchSuggest(
  rawQ: string,
  preferredCities: string[] = []
): Promise<SearchSuggestResult> {
  const q = rawQ.trim();
  if (q.length === 0) {
    return { cities: [], listings: [] };
  }
  const pattern = `%${q.replace(/[%_\\]/g, (x) => `\\${x}`)}%`;

  const cityRows = await query<{ city: string }>(
    `
    SELECT DISTINCT btrim(l."city") AS city
    FROM "bnhub_listings" l
    WHERE l."listing_status" = 'PUBLISHED'
      AND l."city" IS NOT NULL
      AND btrim(l."city") != ''
      AND btrim(l."city") ILIKE $1
    ORDER BY 1
    LIMIT ${MAX_CITIES}
  `,
    [pattern]
  );
  const citiesRaw = cityRows.map((r) => r.city).filter(Boolean);
  const cities = sortCitiesByPreferred(citiesRaw, preferredCities, MAX_CITIES);

  const listingRows = await query<{
    id: string;
    title: string | null;
    city: string | null;
    nightPriceCents: string | null;
  }>(
    `
    SELECT
      l."id"::text,
      l."title",
      l."city",
      l."nightPriceCents"::text
    FROM "bnhub_listings" l
    WHERE l."listing_status" = 'PUBLISHED'
      AND (
        (l."title" IS NOT NULL AND l."title" ILIKE $1)
        OR (l."city" IS NOT NULL AND btrim(l."city") != '' AND l."city" ILIKE $1)
      )
    LIMIT ${LISTING_CAP}
  `,
    [pattern]
  );

  const asRows: SuggestListingRow[] = listingRows.map((r) => {
    const cents = r.nightPriceCents != null ? Number.parseFloat(r.nightPriceCents) : 0;
    const price = Number.isFinite(cents) ? Math.round((cents / 100) * 100) / 100 : 0;
    return {
      id: r.id,
      title: (r.title ?? "Listing").toString() || "Listing",
      city: (r.city ?? "").toString() || "—",
      price,
    };
  });

  const listings = boostListingsByPreferredCities(asRows, preferredCities);
  return { cities, listings };
}
