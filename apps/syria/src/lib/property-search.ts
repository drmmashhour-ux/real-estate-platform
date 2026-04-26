import type { Prisma } from "@/generated/prisma";
import { Prisma as PrismaNs } from "@/generated/prisma";
import { boundingBoxKm } from "@/lib/geo";
import {
  cityCanonicalNamesForGovernorateFilter,
  normalizeCitySearchParam,
  normalizeGovernorateSearchParam,
} from "@/lib/syria-location-catalog";

export type ListingKind = "sale" | "rent" | "bnhub";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function flattenSearchParams(sp: RawSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    out[k] = Array.isArray(v) ? String(v[0] ?? "") : String(v);
  }
  return out;
}

export function parseSearchNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function num(raw: string | undefined): number | undefined {
  return parseSearchNumber(raw);
}

function textSearchOr(q: string): Prisma.SyriaPropertyWhereInput[] | undefined {
  const term = q.trim();
  if (!term) return undefined;
  return [
    { titleAr: { contains: term, mode: "insensitive" } },
    { titleEn: { contains: term, mode: "insensitive" } },
    { descriptionAr: { contains: term, mode: "insensitive" } },
    { descriptionEn: { contains: term, mode: "insensitive" } },
    { city: { contains: term, mode: "insensitive" } },
    { neighborhood: { contains: term, mode: "insensitive" } },
    { area: { contains: term, mode: "insensitive" } },
  ];
}

export function parseAmenityTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 16);
}

export function listingMatchesAmenityTags(amenitiesJson: unknown, tags: string[]): boolean {
  if (tags.length === 0) return true;
  const arr = Array.isArray(amenitiesJson)
    ? amenitiesJson
        .filter((x): x is string => typeof x === "string")
        .map((a) => a.toLowerCase())
    : [];
  return tags.every((tag) => arr.some((a) => a.includes(tag) || tag.includes(a)));
}

export function buildPropertyWhere(
  kind: ListingKind,
  sp: Record<string, string>,
): Prisma.SyriaPropertyWhereInput {
  const type = kind === "sale" ? "SALE" : kind === "rent" ? "RENT" : "BNHUB";

  const andParts: Prisma.SyriaPropertyWhereInput[] = [];

  const orText = textSearchOr(sp.q ?? "");
  if (orText?.length) {
    andParts.push({ OR: orText });
  }

  const cityNorm = normalizeCitySearchParam(sp.city ?? "");
  const govNorm = normalizeGovernorateSearchParam(sp.governorate ?? "");
  if (cityNorm) {
    andParts.push({ city: cityNorm });
  } else if (govNorm) {
    const inCities = cityCanonicalNamesForGovernorateFilter(govNorm);
    const orGov: Prisma.SyriaPropertyWhereInput[] = [{ governorate: govNorm }];
    if (inCities.length > 0) orGov.push({ city: { in: inCities } });
    andParts.push({ OR: orGov });
  } else {
    const cityLegacy = (sp.city ?? "").trim();
    if (cityLegacy) andParts.push({ city: { contains: cityLegacy, mode: "insensitive" } });
  }

  const neighborhood = (sp.neighborhood ?? "").trim();
  if (neighborhood) {
    andParts.push({ neighborhood: { contains: neighborhood, mode: "insensitive" } });
  }

  const area = (sp.area ?? "").trim();
  if (area) {
    andParts.push({
      OR: [
        { area: { contains: area, mode: "insensitive" } },
        { neighborhood: { contains: area, mode: "insensitive" } },
      ],
    });
  }

  const lat = num(sp.lat);
  const lng = num(sp.lng);
  const radiusKm = num(sp.radius) ?? 15;
  if (lat !== undefined && lng !== undefined && radiusKm > 0) {
    const box = boundingBoxKm(lat, lng, radiusKm);
    andParts.push({ latitude: { not: null } });
    andParts.push({ longitude: { not: null } });
    andParts.push({ latitude: { gte: box.minLat, lte: box.maxLat } });
    andParts.push({ longitude: { gte: box.minLng, lte: box.maxLng } });
  }

  const minP = num(sp.minPrice);
  const maxP = num(sp.maxPrice);
  if (minP !== undefined || maxP !== undefined) {
    const price: Prisma.DecimalFilter = {};
    if (minP !== undefined) price.gte = new PrismaNs.Decimal(minP);
    if (maxP !== undefined) price.lte = new PrismaNs.Decimal(maxP);
    andParts.push({ price });
  }

  const beds = num(sp.beds) ?? num(sp.bedrooms);
  if (beds !== undefined) {
    andParts.push({ bedrooms: { gte: beds } });
  }

  const baths = num(sp.baths) ?? num(sp.bathrooms);
  if (baths !== undefined) {
    andParts.push({ bathrooms: { gte: baths } });
  }

  if (sp.furnished === "1" || sp.furnished === "true") {
    andParts.push({ furnished: true });
  }
  if (sp.furnished === "0" || sp.furnished === "false") {
    andParts.push({ furnished: false });
  }

  const cat = (sp.category ?? "").trim();
  if (cat) {
    andParts.push({ propertyCategory: cat });
  }

  const guests = num(sp.guests);
  if (guests !== undefined && type === "BNHUB") {
    andParts.push({
      OR: [{ guestsMax: null }, { guestsMax: { gte: guests } }],
    });
  }

  const base: Prisma.SyriaPropertyWhereInput = {
    type,
    status: "PUBLISHED",
    fraudFlag: false,
  };

  if (andParts.length > 0) {
    base.AND = andParts;
  }

  return base;
}

export function buildPropertyOrderBy(
  sort: string | undefined,
): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "featured":
      return [{ plan: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ plan: "desc" }, { createdAt: "desc" }];
  }
}
