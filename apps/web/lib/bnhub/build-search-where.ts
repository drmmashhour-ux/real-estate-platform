import type { Prisma } from "@prisma/client";
import { prismaUserHasValidBrokerInsurance } from "@/modules/compliance/insurance/insurance.service";
import { getShortTermCityOrFromParam } from "@/lib/geo/city-search";
import {
  normalizeAnyPublicListingCode,
  parseListingCodeFromSearchQuery,
} from "@/lib/listing-code-public";

export type BuildSearchWhereInput = {
  city?: string;
  listingCode?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  verifiedOnly?: boolean;
  insuredOnly?: boolean;
  propertyType?: string;
  roomType?: string;
  instantBook?: boolean;
  minBeds?: number;
  minBaths?: number;
  /** Center for radius filter (WGS84). Requires radiusKm. */
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  /** Optional map bbox (all four required together). */
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  /** `ExpansionCountry.id` — exact FK match on listing. */
  marketCountryId?: string;
  /** `lecipm_cities.id` — exact FK match on listing. */
  marketCityId?: string;
  /**
   * ISO-style country code matching `ExpansionCountry.code` or legacy `ShortTermListing.country` when FK unset.
   */
  countryCode?: string;
};

/** Canadian postal code loose match on listing address / city. */
export function isCanadianPostalToken(s: string): boolean {
  const c = s.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(c);
}

/**
 * Shared WHERE for published BNHUB listing search (paginated + non-paginated).
 */
export function buildPublishedListingSearchWhere(params: BuildSearchWhereInput): Prisma.ShortTermListingWhereInput {
  const where: Prisma.ShortTermListingWhereInput = {};

  const listingCode =
    normalizeAnyPublicListingCode(params.listingCode) ?? parseListingCodeFromSearchQuery(params.city);
  if (listingCode) {
    where.listingCode = { equals: listingCode, mode: "insensitive" };
  } else if (params.city?.trim()) {
    const raw = params.city.trim();
    if (isCanadianPostalToken(raw)) {
      const compact = raw.replace(/\s/g, "").toUpperCase();
      const spaced = `${compact.slice(0, 3)} ${compact.slice(3)}`;
      where.OR = [
        { address: { contains: spaced, mode: "insensitive" } },
        { address: { contains: compact, mode: "insensitive" } },
        { city: { contains: raw, mode: "insensitive" } },
      ];
    } else {
      const knownCityOr = getShortTermCityOrFromParam(raw);
      if (knownCityOr) {
        where.OR = knownCityOr;
      } else {
        where.city = { contains: raw, mode: "insensitive" };
      }
    }
  }

  if (params.minPrice != null || params.maxPrice != null) {
    where.nightPriceCents = {
      ...(params.minPrice != null && { gte: Math.round(params.minPrice * 100) }),
      ...(params.maxPrice != null && { lte: Math.round(params.maxPrice * 100) }),
    };
  }
  const guests = params.guests ?? 0;
  if (guests > 0) where.maxGuests = { gte: guests };
  if (params.verifiedOnly) where.verificationStatus = "VERIFIED";

  if (params.insuredOnly) {
    where.owner = prismaUserHasValidBrokerInsurance(new Date());
  }
  if (params.propertyType?.trim()) {
    where.propertyType = { equals: params.propertyType.trim(), mode: "insensitive" };
  }
  if (params.roomType?.trim()) {
    where.roomType = { equals: params.roomType.trim(), mode: "insensitive" };
  }
  if (params.instantBook === true) where.instantBookEnabled = true;
  if (params.minBeds != null && params.minBeds > 0) where.beds = { gte: params.minBeds };
  if (params.minBaths != null && params.minBaths > 0) where.baths = { gte: params.minBaths };

  const bn = params.north;
  const bs = params.south;
  const be = params.east;
  const bw = params.west;
  if (
    bn != null &&
    bs != null &&
    be != null &&
    bw != null &&
    bn > bs &&
    be > bw &&
    bs >= -90 &&
    bn <= 90 &&
    bw >= -180 &&
    be <= 180
  ) {
    where.latitude = { gte: bs, lte: bn };
    where.longitude = { gte: bw, lte: be };
  }

  const lat = params.centerLat;
  const lng = params.centerLng;
  const r = params.radiusKm;
  if (lat != null && lng != null && typeof r === "number" && Number.isFinite(r) && r > 0 && r <= 200) {
    const dLat = r / 111;
    const dLng = r / (111 * Math.cos((lat * Math.PI) / 180));
    const radiusAnd: Prisma.ShortTermListingWhereInput[] = [
      { latitude: { not: null } },
      { longitude: { not: null } },
      { latitude: { gte: lat - dLat, lte: lat + dLat } },
      { longitude: { gte: lng - dLng, lte: lng + dLng } },
    ];
    const existing = where.AND;
    where.AND = [
      ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
      ...radiusAnd,
    ];
  }

  where.listingStatus = "PUBLISHED";

  const extraAnd: Prisma.ShortTermListingWhereInput[] = [];
  if (params.marketCountryId?.trim()) {
    extraAnd.push({ marketCountryId: params.marketCountryId.trim() });
  }
  if (params.marketCityId?.trim()) {
    extraAnd.push({ marketCityId: params.marketCityId.trim() });
  }
  if (params.countryCode?.trim()) {
    const code = params.countryCode.trim();
    extraAnd.push({
      OR: [
        { marketCountry: { is: { code: { equals: code, mode: "insensitive" } } } },
        { AND: [{ marketCountryId: null }, { country: { equals: code, mode: "insensitive" } }] },
      ],
    });
  }
  if (extraAnd.length) {
    const existing = where.AND;
    const base = Array.isArray(existing) ? existing : existing != null ? [existing] : [];
    where.AND = [...base, ...extraAnd];
  }

  return where;
}

/**
 * @param paginated - When true, `recommended` still uses a DB order (then re-ranked in memory per page).
 */
export function searchOrderBy(
  sort: string | undefined,
  options?: { paginated?: boolean }
): Prisma.ShortTermListingOrderByWithRelationInput[] {
  const paginated = options?.paginated ?? false;
  switch (sort) {
    case "recommended":
    case "ai":
      return paginated ? [{ createdAt: "desc" }] : [];
    case "priceAsc":
      return [{ nightPriceCents: "asc" }];
    case "priceDesc":
      return [{ nightPriceCents: "desc" }];
    case "popular":
      return [{ reviews: { _count: "desc" } }, { createdAt: "desc" }];
    case "best_value":
    case "top_conversion":
      return paginated ? [{ createdAt: "desc" }] : [];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}
