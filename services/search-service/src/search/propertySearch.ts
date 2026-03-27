import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { SearchPropertiesQuery, MapSearchQuery } from "../validation/schemas.js";
import { buildSearchDocument, parseSort, type SortOption } from "./indexer.js";

const prisma = new PrismaClient();

const LIVE_STATUS = "LIVE";

function buildWhere(params: SearchPropertiesQuery): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {
    deletedAt: null,
    status: LIVE_STATUS,
  };
  if (params.city?.trim()) where.city = { contains: params.city.trim(), mode: "insensitive" };
  if (params.country?.trim()) where.country = params.country.trim().toUpperCase();
  if (params.propertyType?.trim()) where.propertyType = { contains: params.propertyType.trim(), mode: "insensitive" };
  if (params.type) where.type = params.type;

  if (params.minPrice != null || params.maxPrice != null) {
    where.nightlyPriceCents = {
      ...(params.minPrice != null && { gte: params.minPrice }),
      ...(params.maxPrice != null && { lte: params.maxPrice }),
    };
  }
  if (params.minGuests != null || params.maxGuests != null) {
    where.maxGuests = {
      ...(params.minGuests != null && { gte: params.minGuests }),
      ...(params.maxGuests != null && { lte: params.maxGuests }),
    };
  }

  if (params.q?.trim()) {
    where.OR = [
      { title: { contains: params.q.trim(), mode: "insensitive" } },
      { description: { contains: params.q.trim(), mode: "insensitive" } },
      { city: { contains: params.q.trim(), mode: "insensitive" } },
      { address: { contains: params.q.trim(), mode: "insensitive" } },
    ];
  }
  return where;
}

function buildOrderBy(sort: SortOption): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ nightlyPriceCents: "asc" }, { createdAt: "desc" }];
    case "price_desc":
      return [{ nightlyPriceCents: "desc" }, { createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function searchProperties(params: SearchPropertiesQuery & { page: number; pageSize: number; sort: SortOption }) {
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);
  const page = params.page;
  const pageSize = params.pageSize;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: true, amenities: true },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: items.map(buildSearchDocument),
    pagination: {
      page,
      pageSize,
      totalCount: total,
      hasMore: page * pageSize < total,
    },
  };
}

export async function getSuggestions(field: "city" | "propertyType", q: string, limit: number) {
  const search = q.trim().toLowerCase();
  if (!search) return { suggestions: [] };

  if (field === "city") {
    const rows = await prisma.property.findMany({
      where: {
        deletedAt: null,
        status: LIVE_STATUS,
        city: { contains: search, mode: "insensitive" },
      },
      select: { city: true, country: true },
      distinct: ["city", "country"],
      take: limit * 2,
    });
    const seen = new Set<string>();
    const suggestions = rows
      .map((r) => ({ value: r.city, country: r.country, label: `${r.city}, ${r.country}` }))
      .filter((s) => {
        const key = s.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
    return { suggestions };
  }

  const rows = await prisma.property.findMany({
    where: {
      deletedAt: null,
      status: LIVE_STATUS,
      propertyType: { not: null, contains: search, mode: "insensitive" },
    },
    select: { propertyType: true },
    distinct: ["propertyType"],
    take: limit,
  });
  const suggestions = rows
    .map((r) => r.propertyType as string)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  return { suggestions: suggestions.map((value) => ({ value })) };
}

export async function searchMap(params: MapSearchQuery & { page: number; pageSize: number }) {
  const where: Prisma.PropertyWhereInput = {
    deletedAt: null,
    status: LIVE_STATUS,
    latitude: { not: null },
    longitude: { not: null },
  };

  if (params.minLat != null && params.maxLat != null && params.minLng != null && params.maxLng != null) {
    where.latitude = { gte: params.minLat, lte: params.maxLat };
    where.longitude = { gte: params.minLng, lte: params.maxLng };
  } else if (params.lat != null && params.lng != null && params.radiusKm != null) {
    const km = params.radiusKm;
    const latDelta = km / 111;
    const lngDelta = km / (111 * Math.cos((params.lat * Math.PI) / 180));
    where.latitude = { gte: params.lat - latDelta, lte: params.lat + latDelta };
    where.longitude = { gte: params.lng - lngDelta, lte: params.lng + lngDelta };
  }

  const page = params.page;
  const pageSize = params.pageSize;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: true, amenities: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: items.map(buildSearchDocument),
    pagination: {
      page,
      pageSize,
      totalCount: total,
      hasMore: page * pageSize < total,
    },
  };
}
