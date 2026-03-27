import type { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { geocodeAddressLine } from "@/lib/geo/geocode-nominatim";
import {
  applyFsboPropertyFilters,
  hasActivePropertyBrowseFilters,
  parsePropertyBrowseFiltersFromBody,
  type PropertyBrowseFilters,
} from "@/lib/buy/property-browse-filters";
import { prisma } from "@/lib/db";
import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { parseGlobalSearchBody, urlParamsToGlobalFilters } from "@/components/search/FilterState";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;
const POOL = 80;
const POOL_WITH_LIFESTYLE = 500;

type UnifiedRow = {
  kind: "fsbo" | "crm";
  id: string;
  title: string;
  priceCents: number;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  images: string[];
  propertyType: string | null;
  sortAt: number;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
};

function buildFsboWhere(
  f: GlobalSearchFiltersExtended,
  pf?: PropertyBrowseFilters | null
): Prisma.FsboListingWhereInput[] {
  const fsboAnd: Prisma.FsboListingWhereInput[] = [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }];

  const cityRaw = f.location.trim();
  if (cityRaw) fsboAnd.push(fsboCityWhereFromParam(cityRaw));

  if (f.type === "rent") {
    fsboAnd.push({ listingDealType: "RENT" });
  } else {
    fsboAnd.push({ listingDealType: "SALE" });
  }

  const propCategory =
    f.type === "rent" ? (f.rentListingCategory ?? "residential") : f.type;

  if (propCategory === "commercial") {
    fsboAnd.push({ propertyType: { equals: "COMMERCIAL", mode: "insensitive" } });
  } else if (propCategory === "new_construction") {
    fsboAnd.push({ NOT: { propertyType: { equals: "COMMERCIAL", mode: "insensitive" } } });
    fsboAnd.push({
      OR: [
        { description: { contains: "new construction", mode: "insensitive" } },
        { description: { contains: "new-construction", mode: "insensitive" } },
        { title: { contains: "new construction", mode: "insensitive" } },
      ],
    });
  } else if (propCategory === "residential") {
    fsboAnd.push({ NOT: { propertyType: { equals: "COMMERCIAL", mode: "insensitive" } } });
    const multi = f.propertyTypes?.map((x) => x.trim()).filter(Boolean) ?? [];
    if (multi.length > 0) {
      fsboAnd.push({ propertyType: { in: multi, mode: "insensitive" } });
    } else if (f.propertyType?.trim()) {
      fsboAnd.push({ propertyType: { equals: f.propertyType.trim(), mode: "insensitive" } });
    }
  } else {
    const multi = f.propertyTypes?.map((x) => x.trim()).filter(Boolean) ?? [];
    if (multi.length > 0) {
      fsboAnd.push({ propertyType: { in: multi, mode: "insensitive" } });
    } else if (f.propertyType?.trim()) {
      fsboAnd.push({ propertyType: { equals: f.propertyType.trim(), mode: "insensitive" } });
    }
  }

  const effMinCad =
    f.type === "luxury_properties" || (f.type === "rent" && f.rentListingCategory === "luxury_properties")
      ? Math.max(f.priceMin, 1_000_000)
      : f.priceMin;
  if (effMinCad > 0) {
    fsboAnd.push({ priceCents: { gte: Math.round(effMinCad) * 100 } });
  }
  if (f.priceMax > 0) {
    fsboAnd.push({ priceCents: { lte: Math.round(f.priceMax) * 100 } });
  }
  if (f.bedrooms != null && f.bedrooms >= 0) {
    fsboAnd.push({ bedrooms: { gte: f.bedrooms } });
  }
  if (f.bathrooms != null && f.bathrooms >= 0) {
    fsboAnd.push({ bathrooms: { gte: f.bathrooms } });
  }
  if (f.minSqft != null && f.minSqft >= 0) {
    fsboAnd.push({ surfaceSqft: { gte: f.minSqft } });
  }
  if (f.maxSqft != null && f.maxSqft >= 0) {
    fsboAnd.push({ surfaceSqft: { lte: f.maxSqft } });
  }
  if (f.yearBuiltMin != null && f.yearBuiltMin > 1700) {
    fsboAnd.push({ yearBuilt: { gte: f.yearBuiltMin } });
  }
  if (f.yearBuiltMax != null && f.yearBuiltMax > 1700) {
    fsboAnd.push({ yearBuilt: { lte: f.yearBuiltMax } });
  }

  if (f.type === "rent") {
    if (f.furnished === "yes") {
      fsboAnd.push({ description: { contains: "furnished", mode: "insensitive" } });
    } else if (f.furnished === "no") {
      fsboAnd.push({ description: { contains: "unfurnished", mode: "insensitive" } });
    }
    const lm = f.leaseMonthsMin;
    if (lm != null && lm > 0) {
      fsboAnd.push({
        OR: [
          { description: { contains: `${lm} month`, mode: "insensitive" as const } },
          { description: { contains: `${lm} months`, mode: "insensitive" as const } },
          { description: { contains: `${lm} mo`, mode: "insensitive" as const } },
          ...(lm === 12
            ? [
                { description: { contains: "one year", mode: "insensitive" as const } },
                { description: { contains: "1 year", mode: "insensitive" as const } },
              ]
            : []),
          ...(lm === 24
            ? [
                { description: { contains: "two year", mode: "insensitive" as const } },
                { description: { contains: "2 year", mode: "insensitive" as const } },
              ]
            : []),
        ],
      });
    }
    if (f.features.length > 0) {
      fsboAnd.push({
        OR: f.features.map((term) => ({
          description: { contains: term, mode: "insensitive" as const },
        })),
      });
    }
  } else if (f.features.length > 0) {
    fsboAnd.push({
      OR: f.features.map((term) => ({
        description: { contains: term, mode: "insensitive" as const },
      })),
    });
  }

  const n = f.north;
  const s = f.south;
  const e = f.east;
  const w = f.west;
  if (n != null && s != null && e != null && w != null && n > s && e > w && s >= -90 && n <= 90 && w >= -180 && e <= 180) {
    fsboAnd.push(
      { latitude: { not: null } },
      { longitude: { not: null } },
      { latitude: { gte: s, lte: n } },
      { longitude: { gte: w, lte: e } }
    );
  }

  if (pf?.noiseLevel) fsboAnd.push({ noiseLevel: pf.noiseLevel });
  if (pf?.familyFriendly) fsboAnd.push({ familyFriendly: true });
  if (pf?.partyFriendly) fsboAnd.push({ partyAllowed: true });
  if (pf?.petsOnly) fsboAnd.push({ petsAllowed: true });

  if (f.type === "new_listing") {
    const since = new Date();
    since.setDate(since.getDate() - 14);
    fsboAnd.push({ updatedAt: { gte: since } });
  }

  return fsboAnd;
}

function fireAndForgetGeocodeFsbo(
  rows: { id: string; address: string; city: string; latitude: number | null; longitude: number | null }[]
) {
  const need = rows.filter((r) => r.latitude == null || r.longitude == null).slice(0, 5);
  void (async () => {
    for (const r of need) {
      const q = await geocodeAddressLine(`${r.address}, ${r.city}`);
      if (q) {
        await prisma.fsboListing
          .update({
            where: { id: r.id },
            data: { latitude: q.latitude, longitude: q.longitude },
          })
          .catch(() => {});
      }
      await new Promise((res) => setTimeout(res, 1100));
    }
  })();
}

async function runBrowse(
  f: GlobalSearchFiltersExtended,
  page: number,
  limit: number,
  propertyFilters: PropertyBrowseFilters | null
) {
  if (f.type === "short") {
    return Response.json(
      { error: "Stays search uses POST /api/bnhub/listings with type short.", code: "USE_BNHUB" },
      { status: 400 }
    );
  }

  if (f.type === "sell") {
    return Response.json({
      data: [],
      total: 0,
      page,
      limit,
      hasMore: false,
      filters: f,
      propertyFiltersActive: false,
      message: "Use the Sell paths to list — open /selling from the search bar.",
    });
  }

  const hasPF = hasActivePropertyBrowseFilters(propertyFilters);
  const fsboAnd = buildFsboWhere(f, propertyFilters);
  const poolTake = hasPF ? POOL_WITH_LIFESTYLE : POOL;

  const crmAnd: Prisma.ListingWhereInput[] = [];
  const crmMin =
    f.type === "luxury_properties" || (f.type === "rent" && f.rentListingCategory === "luxury_properties")
      ? Math.max(f.priceMin, 1_000_000)
      : f.priceMin;
  if (crmMin > 0) {
    crmAnd.push({ price: { gte: crmMin } });
  }
  if (f.priceMax > 0) {
    crmAnd.push({ price: { lte: f.priceMax } });
  }
  if (f.type === "new_listing") {
    const sinceCrm = new Date();
    sinceCrm.setDate(sinceCrm.getDate() - 14);
    crmAnd.push({ createdAt: { gte: sinceCrm } });
  }

  const [fsboTotal, crmTotal, fsboRows, crmRows] = await Promise.all([
    prisma.fsboListing.count({ where: { AND: fsboAnd } }),
    hasPF ? Promise.resolve(0) : prisma.listing.count({ where: crmAnd.length ? { AND: crmAnd } : {} }),
    prisma.fsboListing.findMany({
      where: { AND: fsboAnd },
      orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      take: poolTake,
      select: {
        id: true,
        title: true,
        priceCents: true,
        city: true,
        address: true,
        bedrooms: true,
        bathrooms: true,
        images: true,
        coverImage: true,
        propertyType: true,
        updatedAt: true,
        latitude: true,
        longitude: true,
        noiseLevel: true,
        familyFriendly: true,
        kidsAllowed: true,
        partyAllowed: true,
        smokingAllowed: true,
        petsAllowed: true,
        allowedPetTypes: true,
        maxPetWeightKg: true,
        petRules: true,
        experienceTags: true,
        servicesOffered: true,
      },
    }),
    hasPF
      ? Promise.resolve([] as { id: string; title: string; price: unknown; createdAt: Date }[])
      : prisma.listing.findMany({
          where: crmAnd.length ? { AND: crmAnd } : {},
          orderBy: { createdAt: "desc" },
          take: POOL,
          select: {
            id: true,
            title: true,
            price: true,
            listingCode: true,
            createdAt: true,
          },
        }),
  ]);

  fireAndForgetGeocodeFsbo(fsboRows);

  const fsboFiltered = applyFsboPropertyFilters(fsboRows, propertyFilters);

  const fsboMapped: UnifiedRow[] = fsboFiltered.map((r) => ({
    kind: "fsbo" as const,
    id: r.id,
    title: r.title,
    priceCents: r.priceCents,
    city: r.city,
    bedrooms: r.bedrooms ?? null,
    bathrooms: r.bathrooms ?? null,
    coverImage: r.coverImage,
    images: Array.isArray(r.images) ? r.images : [],
    propertyType: r.propertyType ?? null,
    sortAt: new Date(r.updatedAt).getTime(),
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    address: r.address ?? null,
    noiseLevel: r.noiseLevel ?? null,
    familyFriendly: r.familyFriendly,
    petsAllowed: r.petsAllowed,
  }));

  const crmMapped: UnifiedRow[] = crmRows.map((r) => ({
    kind: "crm" as const,
    id: r.id,
    title: r.title,
    priceCents: Math.round(Number(r.price) * 100),
    city: "Marketplace",
    bedrooms: null,
    bathrooms: null,
    coverImage: null,
    images: [] as string[],
    propertyType: "CRM",
    sortAt: new Date(r.createdAt).getTime(),
  }));

  const sortMode = f.sort ?? "recommended";
  const merged = [...fsboMapped, ...crmMapped];
  if (sortMode === "priceAsc") {
    merged.sort((a, b) => a.priceCents - b.priceCents);
  } else if (sortMode === "priceDesc") {
    merged.sort((a, b) => b.priceCents - a.priceCents);
  } else {
    merged.sort((a, b) => b.sortAt - a.sortAt);
  }
  const total = hasPF ? fsboFiltered.length : fsboTotal + crmTotal;
  const skip = (page - 1) * limit;
  const pageRows = merged.slice(skip, skip + limit).map(({ sortAt: _s, ...rest }) => rest);

  return Response.json({
    data: pageRows,
    total,
    page,
    limit,
    hasMore: skip + pageRows.length < merged.length,
    filters: f,
    propertyFiltersActive: hasPF,
  });
}

/** Fast total for filter panel footer (same DB predicates as browse, no pool merge). */
async function runBrowseCountOnly(f: GlobalSearchFiltersExtended, propertyFilters: PropertyBrowseFilters | null) {
  if (f.type === "short") {
    return Response.json({ error: "Use BNHub for short-term count", code: "USE_BNHUB" }, { status: 400 });
  }
  if (f.type === "sell") {
    return Response.json({ total: 0, fsboTotal: 0, crmTotal: 0 });
  }
  const hasPF = hasActivePropertyBrowseFilters(propertyFilters);
  const fsboAnd = buildFsboWhere(f, propertyFilters);
  const crmAnd: Prisma.ListingWhereInput[] = [];
  const crmMinCo =
    f.type === "luxury_properties" || (f.type === "rent" && f.rentListingCategory === "luxury_properties")
      ? Math.max(f.priceMin, 1_000_000)
      : f.priceMin;
  if (crmMinCo > 0) {
    crmAnd.push({ price: { gte: crmMinCo } });
  }
  if (f.priceMax > 0) {
    crmAnd.push({ price: { lte: f.priceMax } });
  }
  if (f.type === "new_listing") {
    const sinceCrm = new Date();
    sinceCrm.setDate(sinceCrm.getDate() - 14);
    crmAnd.push({ createdAt: { gte: sinceCrm } });
  }
  const [fsboTotal, crmTotal] = await Promise.all([
    prisma.fsboListing.count({ where: { AND: fsboAnd } }),
    hasPF ? Promise.resolve(0) : prisma.listing.count({ where: crmAnd.length ? { AND: crmAnd } : {} }),
  ]);
  return Response.json({ total: fsboTotal + crmTotal, fsboTotal, crmTotal });
}

/**
 * GET — query string (legacy + global keys) or
 * POST — JSON body `{ location, type, priceMin, priceMax, bedrooms, features, ... propertyFilters }`
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const f = urlParamsToGlobalFilters(searchParams);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    return runBrowse({ ...f, page }, page, limit, null);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Browse failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json().catch(() => ({}));
    const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    if (o.countOnly === true) {
      const f = parseGlobalSearchBody(raw);
      const propertyFilters = parsePropertyBrowseFiltersFromBody(raw);
      return runBrowseCountOnly(f, propertyFilters);
    }
    const f = parseGlobalSearchBody(raw);
    const page = Math.max(1, f.page ?? 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String((raw as Record<string, unknown>).limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const propertyFilters = parsePropertyBrowseFiltersFromBody(raw);
    return runBrowse({ ...f, page }, page, limit, propertyFilters);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Browse failed" }, { status: 500 });
  }
}
