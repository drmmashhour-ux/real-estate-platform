import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseListingCodeFromSearchQuery, normalizeAnyPublicListingCode } from "@/lib/listing-code-public";
import { isCanadianPostalToken } from "@/lib/bnhub/build-search-where";
import { shortTermListingCityOrConditions, normalizeCitySlug } from "@/lib/geo/city-search";
import { hasActiveStaysFilters } from "@/lib/bnhub/stays-filters";
import type { ListingSearchParams } from "@/lib/bnhub/listings";

export const MAX_Q_LEN = 200;
export const DEFAULT_MAX_IDS_NON_PAG = 2000;

/**
 * Heuristic: BNHub GIN (Order 79) + hybrid SQL when `q` is set and
 * geo/insurance/amenity filters not mirrored in the FTS path are absent.
 */
export function canUseOrder80FtsPath(params: ListingSearchParams & { q?: string }): boolean {
  const q = params.q?.trim();
  if (!q || q.length < 2) return false;
  if (q.length > MAX_Q_LEN) return false;
  if (params.insuredOnly) return false;
  if (params.verifiedOnly) return false;
  const codeFromParam = params.listingCode?.trim()
    ? normalizeAnyPublicListingCode(params.listingCode)
    : null;
  if (codeFromParam || parseListingCodeFromSearchQuery(params.city)) {
    return false;
  }
  if (params.city && isCanadianPostalToken(params.city)) return false;
  if (params.north != null && params.south != null && params.east != null && params.west != null) {
    return false;
  }
  if (
    params.centerLat != null &&
    params.centerLng != null &&
    typeof params.radiusKm === "number" &&
    params.radiusKm > 0
  ) {
    return false;
  }
  if (params.amenitySlugs && params.amenitySlugs.length > 0) return false;
  if (params.discoveryFeatures && params.discoveryFeatures.length > 0) return false;
  if (hasActiveStaysFilters(params.staysFilters)) return false;
  return true;
}

function sanitizeFtsQ(q: string): string {
  return q.trim().slice(0, MAX_Q_LEN);
}

/**
 * @returns OR / single ILIKE on `l."city"`.
 */
function buildCityFilterSql(city: string | undefined): Prisma.Sql | null {
  if (!city?.trim()) return null;
  const raw = city.trim();
  const slug = normalizeCitySlug(raw);
  if (slug) {
    const conds = shortTermListingCityOrConditions(slug) as { city?: { contains: string; mode: string } }[];
    const parts: Prisma.Sql[] = [];
    for (const c of conds) {
      const t = c.city?.contains;
      if (typeof t === "string") {
        const pat = `%${t}%`;
        parts.push(Prisma.sql`l."city" ILIKE ${pat}`);
      }
    }
    if (parts.length) {
      return Prisma.sql`(${Prisma.join(parts, " OR ")})`;
    }
  }
  const pat = `%${raw}%`;
  return Prisma.sql`l."city" ILIKE ${pat}`;
}

function buildCountryFilterSql(
  countryCode: string | undefined,
  marketCountryId: string | undefined
): Prisma.Sql | null {
  if (marketCountryId?.trim()) {
    return Prisma.sql`l."market_country_id" = ${marketCountryId.trim()}`;
  }
  if (countryCode?.trim()) {
    const c = countryCode.trim();
    return Prisma.sql`UPPER(l."country") = UPPER(${c})`;
  }
  return null;
}

function titleMatchFts(fts: boolean, q: string): Prisma.Sql {
  if (fts) {
    return Prisma.sql`to_tsvector('english', l."title") @@ plainto_tsquery('english', ${q})`;
  }
  const safe = sanitizeFtsQ(q).replace(/[%_\\]/g, " ");
  const pat = `%${safe}%`;
  return Prisma.sql`l."title" ILIKE ${pat}`;
}

type FtsFilterArgs = {
  q: string;
  useIlike: boolean;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  minRating?: number;
  propertyType?: string;
  roomType?: string;
  instantBook?: boolean;
  minBeds?: number;
  minBaths?: number;
  marketCountryId?: string;
  marketCityId?: string;
  countryCode?: string;
};

function buildBnhubListingWhereFragments(args: FtsFilterArgs): Prisma.Sql[] {
  const q = sanitizeFtsQ(args.q);
  const useFts = !args.useIlike;
  const conditions: Prisma.Sql[] = [
    Prisma.sql`l."listingStatus" = 'PUBLISHED'`,
    titleMatchFts(useFts, q),
  ];
  if (args.minPrice != null && args.minPrice > 0) {
    conditions.push(Prisma.sql`l."nightPriceCents" >= ${Math.round(args.minPrice * 100)}`);
  }
  if (args.maxPrice != null && args.maxPrice > 0) {
    conditions.push(Prisma.sql`l."nightPriceCents" <= ${Math.round(args.maxPrice * 100)}`);
  }
  const guests = args.guests ?? 0;
  if (guests > 0) {
    conditions.push(Prisma.sql`l."maxGuests" >= ${guests}`);
  }
  if (args.minRating != null && args.minRating > 0) {
    conditions.push(Prisma.sql`l."bnhub_listing_rating_average" >= ${args.minRating}`);
  }
  if (args.propertyType?.trim()) {
    conditions.push(Prisma.sql`l."propertyType" ILIKE ${args.propertyType.trim()}`);
  }
  if (args.roomType?.trim()) {
    conditions.push(Prisma.sql`l."roomType" ILIKE ${args.roomType.trim()}`);
  }
  if (args.instantBook === true) {
    conditions.push(Prisma.sql`l."instantBookEnabled" = true`);
  }
  if (args.minBeds != null && args.minBeds > 0) {
    conditions.push(Prisma.sql`l."beds" >= ${args.minBeds}`);
  }
  if (args.minBaths != null && args.minBaths > 0) {
    conditions.push(Prisma.sql`l."baths" >= ${args.minBaths}`);
  }
  if (args.marketCityId?.trim()) {
    conditions.push(Prisma.sql`l."market_city_id" = ${args.marketCityId.trim()}`);
  }
  const csql = buildCountryFilterSql(args.countryCode, args.marketCountryId);
  if (csql) {
    conditions.push(csql);
  }
  const citySql = buildCityFilterSql(args.city);
  if (citySql) {
    conditions.push(citySql);
  }
  return conditions;
}

/**
 * Order 80.1 — GIN on `to_tsvector('english', title) @@ plainto_tsquery` + btree filters.
 */
export async function runBnhubFtsIdQuery(
  args: FtsFilterArgs & { skip: number; take: number }
): Promise<{ rows: { id: string }[]; usedFts: boolean }> {
  const useFts = !args.useIlike;
  const where = Prisma.join(buildBnhubListingWhereFragments(args), " AND ");
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT l."id"::text AS id
    FROM "bnhub_listings" l
    WHERE ${where}
    ORDER BY l."id" ASC
    LIMIT ${args.take}
    OFFSET ${args.skip}
  `;
  return { rows, usedFts: useFts };
}

export async function runBnhubFtsIdCount(args: FtsFilterArgs): Promise<bigint> {
  const where = Prisma.join(buildBnhubListingWhereFragments(args), " AND ");
  const c = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM "bnhub_listings" l
    WHERE ${where}
  `;
  return c[0]?.c ?? BigInt(0);
}

/**
 * Tries GIN + plainto_tsquery first; if zero rows, ILIKE on title (same filters).
 */
export async function runBnhubFtsWithIlikeFallback(
  input: FtsFilterArgs & { skip: number; take: number }
): Promise<{
  rows: { id: string }[];
  total: bigint;
  usedFts: boolean;
  usedIlikeFallback: boolean;
}> {
  const first = await runBnhubFtsIdQuery({ ...input, useIlike: false });
  if (first.rows.length > 0) {
    const total = await runBnhubFtsIdCount({ ...input, useIlike: false });
    return { rows: first.rows, total, usedFts: true, usedIlikeFallback: false };
  }
  const second = await runBnhubFtsIdQuery({ ...input, useIlike: true });
  const total = await runBnhubFtsIdCount({ ...input, useIlike: true });
  return { rows: second.rows, total, usedFts: false, usedIlikeFallback: true };
}
