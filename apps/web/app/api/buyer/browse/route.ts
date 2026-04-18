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
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { getListingTransactionFlagsForListings } from "@/lib/fsbo/listing-transaction-flag";
import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { parseGlobalSearchBody, urlParamsToGlobalFilters } from "@/components/search/FilterState";
import { ListingAnalyticsKind } from "@prisma/client";
import { buildFsboRecommendedBrowseSortUnit } from "@/lib/listings/marketplace-browse-sort";
import { engineFlags } from "@/config/feature-flags";
import { isAiRankingEngineEnabled } from "@/src/modules/ranking/rankingEnv";
import { scoreRealEstateListingsForBrowse } from "@/src/modules/ranking/rankingService";
import { scoreRealEstateListingsForBrowseV2 } from "@/src/modules/ranking/v2/browse-scores";
import { resolvedBrowseCoverAndImages } from "@/lib/listings/browse-listing-images";

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
  featuredUntil?: Date | null;
  createdAt?: Date;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
    tone: "amber" | "emerald" | "slate";
  } | null;
  /** Broker CRM rows, or FSBO published under a broker with license verification on file (matches public listing detail). */
  verifiedListing: boolean;
};

function buildFsboWhere(
  f: GlobalSearchFiltersExtended,
  pf?: PropertyBrowseFilters | null
): Prisma.FsboListingWhereInput[] {
  const fsboAnd: Prisma.FsboListingWhereInput[] = [buildFsboPublicVisibilityWhere()];

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
        createdAt: true,
        featuredUntil: true,
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
        status: true,
        listingOwnerType: true,
        rankingTotalScoreCache: true,
        owner: {
          select: {
            brokerVerifications: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              select: { verificationStatus: true },
            },
          },
        },
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
  const transactionFlags = await getListingTransactionFlagsForListings(
    fsboFiltered.map((row) => ({ id: row.id, status: row.status }))
  );

  const fsboMapped: UnifiedRow[] = fsboFiltered.map((r) => {
    const { coverImage, images } = resolvedBrowseCoverAndImages({
      id: r.id,
      coverImage: r.coverImage,
      images: Array.isArray(r.images) ? r.images : [],
    });
    const brokerV = r.owner.brokerVerifications[0];
    const verifiedListing =
      r.listingOwnerType === "BROKER" && brokerV?.verificationStatus === "VERIFIED";
    return {
    kind: "fsbo" as const,
    id: r.id,
    title: r.title,
    priceCents: r.priceCents,
    city: r.city,
    bedrooms: r.bedrooms ?? null,
    bathrooms: r.bathrooms ?? null,
    coverImage,
    images,
    propertyType: r.propertyType ?? null,
    sortAt: new Date(r.updatedAt).getTime(),
    featuredUntil: r.featuredUntil ?? null,
    createdAt: r.createdAt,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    address: r.address ?? null,
    noiseLevel: r.noiseLevel ?? null,
    familyFriendly: r.familyFriendly,
    petsAllowed: r.petsAllowed,
    transactionFlag: transactionFlags.get(r.id) ?? null,
    verifiedListing,
  };
  });

  const crmMapped: UnifiedRow[] = crmRows.map((r) => {
    const { coverImage, images } = resolvedBrowseCoverAndImages({
      id: r.id,
      coverImage: null,
      images: [],
    });
    return {
    kind: "crm" as const,
    id: r.id,
    title: r.title,
    priceCents: Math.round(Number(r.price) * 100),
    city: "Marketplace",
    bedrooms: null,
    bathrooms: null,
    coverImage,
    images,
    propertyType: "CRM",
    sortAt: new Date(r.createdAt).getTime(),
    verifiedListing: true,
  };
  });

  const sortMode = f.sort ?? "recommended";
  const merged = [...fsboMapped, ...crmMapped];
  if (sortMode === "priceAsc") {
    merged.sort((a, b) => a.priceCents - b.priceCents);
  } else if (sortMode === "priceDesc") {
    merged.sort((a, b) => b.priceCents - a.priceCents);
  } else if (sortMode === "newest") {
    merged.sort((a, b) => {
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : b.sortAt;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : a.sortAt;
      return tb - ta;
    });
  } else if (sortMode === "ranking") {
    const fsboIdsRank = merged.filter((m) => m.kind === "fsbo").map((m) => m.id);
    const cacheById = new Map(
      fsboFiltered.map((r) => [r.id, r.rankingTotalScoreCache ?? 0])
    );
    const effMinCadR =
      f.type === "luxury_properties" || (f.type === "rent" && f.rentListingCategory === "luxury_properties")
        ? Math.max(f.priceMin, 1_000_000)
        : f.priceMin;
    let liveScores: Map<string, number> | null = null;
    const needLive =
      isAiRankingEngineEnabled() &&
      fsboIdsRank.length > 0 &&
      (!engineFlags.rankingV1 || fsboIdsRank.some((id) => (cacheById.get(id) ?? 0) <= 0));
    if (needLive) {
      liveScores = await scoreRealEstateListingsForBrowse(fsboIdsRank, {
        city: f.location.trim() || undefined,
        propertyType: f.propertyType?.trim() || undefined,
        budgetMinCents: effMinCadR > 0 ? Math.round(effMinCadR * 100) : undefined,
        budgetMaxCents: f.priceMax > 0 ? Math.round(f.priceMax * 100) : undefined,
      });
    }
    for (const row of merged) {
      if (row.kind !== "fsbo") continue;
      const cached = cacheById.get(row.id) ?? 0;
      if (engineFlags.rankingV1 && cached > 0) {
        row.sortAt = Math.round(cached * 1_000_000);
      } else if (liveScores) {
        row.sortAt = Math.round((liveScores.get(row.id) ?? 35) * 1_000_000);
      } else {
        row.sortAt = Math.round((cached > 0 ? cached : 35) * 1_000_000);
      }
    }
    merged.sort((a, b) => b.sortAt - a.sortAt);
  } else if (sortMode === "recommended" || sortMode === "aiScore") {
    const fsboIds = merged.filter((m) => m.kind === "fsbo").map((m) => m.id);
    const effMinCad =
      f.type === "luxury_properties" || (f.type === "rent" && f.rentListingCategory === "luxury_properties")
        ? Math.max(f.priceMin, 1_000_000)
        : f.priceMin;
    const analyticsRows =
      fsboIds.length > 0
        ? await prisma.listingAnalytics.findMany({
            where: { kind: ListingAnalyticsKind.FSBO, listingId: { in: fsboIds } },
          })
        : [];
    const analyticsMap = new Map(analyticsRows.map((a) => [a.listingId, a]));
    const nowMs = Date.now();

    if (isAiRankingEngineEnabled()) {
      const scoreFn = engineFlags.rankingV2 ? scoreRealEstateListingsForBrowseV2 : scoreRealEstateListingsForBrowse;
      const scores = await scoreFn(fsboIds, {
        city: f.location.trim() || undefined,
        propertyType: f.propertyType?.trim() || undefined,
        budgetMinCents: effMinCad > 0 ? Math.round(effMinCad * 100) : undefined,
        budgetMaxCents: f.priceMax > 0 ? Math.round(f.priceMax * 100) : undefined,
      });
      for (const row of merged) {
        if (row.kind === "fsbo") {
          row.sortAt = Math.round((scores.get(row.id) ?? 35) * 1_000_000);
        }
      }
    } else {
      for (const row of merged) {
        if (row.kind !== "fsbo") continue;
        const a = analyticsMap.get(row.id);
        const createdAt = row.createdAt ?? new Date(row.sortAt);
        row.sortAt = Math.round(
          buildFsboRecommendedBrowseSortUnit({
            nowMs,
            featuredUntil: row.featuredUntil ?? null,
            createdAt,
            demandScore: a?.demandScore ?? 0,
            viewsTotal: a?.viewsTotal ?? 0,
            unlockSuccesses: a?.unlockCheckoutSuccesses ?? 0,
            imageCount: row.images.length,
          }) * 1e15
        );
      }
    }
    merged.sort((a, b) => b.sortAt - a.sortAt);
  } else {
    merged.sort((a, b) => b.sortAt - a.sortAt);
  }
  const total = hasPF ? fsboFiltered.length : fsboTotal + crmTotal;
  const skip = (page - 1) * limit;
  const sliced = merged.slice(skip, skip + limit).map((row) => {
    const { sortAt: _sortAt, ...rest } = row;
    void _sortAt;
    return rest;
  });

  /** First-paint map pins: geocode FSBO rows on this page missing coordinates (bounded; persists to DB). */
  const pageRows: Omit<UnifiedRow, "sortAt">[] = [];
  let geocodeBudget = 10;
  for (const row of sliced) {
    if (row.kind !== "fsbo") {
      pageRows.push(row);
      continue;
    }
    if ((row.latitude != null && row.longitude != null) || geocodeBudget <= 0) {
      pageRows.push(row);
      continue;
    }
    const addr = row.address?.trim() ?? "";
    const city = row.city?.trim() ?? "";
    const line = [addr, city].filter(Boolean).join(", ").trim();
    if (!line) {
      pageRows.push(row);
      continue;
    }
    geocodeBudget--;
    const q = await geocodeAddressLine(line);
    if (q) {
      void prisma.fsboListing
        .update({
          where: { id: row.id },
          data: { latitude: q.latitude, longitude: q.longitude },
        })
        .catch(() => {});
      pageRows.push({ ...row, latitude: q.latitude, longitude: q.longitude });
      await new Promise((r) => setTimeout(r, 350));
    } else {
      pageRows.push(row);
    }
  }

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
    return Response.json({ error: "Use BNHUB for short-term count", code: "USE_BNHUB" }, { status: 400 });
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
