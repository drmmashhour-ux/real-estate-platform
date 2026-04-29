import { ListingStatus } from "@prisma/client";

import { fsboCityWhereFromParam, type CitySlug } from "@/lib/geo/city-search";
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { getShortTermCityOrFromParam } from "@/lib/geo/city-search";
import { prisma } from "@/lib/db";

import type { SeoCityListingsPreview, SeoCityMarketStats } from "./seo-city.types";

export async function fetchSeoCityMarketStats(slug: CitySlug, now = new Date()): Promise<SeoCityMarketStats> {
  const cityOr = getShortTermCityOrFromParam(slug);
  const q = getSearchQueryForSlug(slug);

  let fsboCount = 0;
  let bnhubCount = 0;
  let avgPrice: number | null = null;
  let avgNight: number | null = null;

  try {
    const fsboStats = await prisma.fsboListing.aggregate({
      where: {
        AND: [buildFsboPublicVisibilityWhere(now), fsboCityWhereFromParam(q)],
      },
      _avg: { priceCents: true },
      _count: { _all: true },
    });
    fsboCount = fsboStats._count._all;
    avgPrice = fsboStats._avg.priceCents;

    const bn = await prisma.shortTermListing.aggregate({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        OR: cityOr ?? [{ city: { contains: q, mode: "insensitive" } }],
      },
      _avg: { nightPriceCents: true },
      _count: { _all: true },
    });
    bnhubCount = bn._count._all;
    avgNight = bn._avg.nightPriceCents;
  } catch {
    /* prisma unavailable in tests / CI */
  }

  return {
    citySlug: slug,
    fsboCount,
    bnhubCount,
    avgPriceCentsFsbo: avgPrice,
    avgNightCentsBnhub: avgNight,
    generatedAtIso: new Date().toISOString(),
  };
}

function getSearchQueryForSlug(slug: CitySlug): string {
  switch (slug) {
    case "montreal":
      return "montreal";
    case "laval":
      return "laval";
    case "quebec":
      return "quebec";
  }
}

export async function fetchSeoListingsPreview(slug: CitySlug, now = new Date()): Promise<SeoCityListingsPreview[]> {
  const q = getSearchQueryForSlug(slug);
  const out: SeoCityListingsPreview[] = [];
  try {
    const fsbo = await prisma.fsboListing.findMany({
      where: {
        AND: [buildFsboPublicVisibilityWhere(now), fsboCityWhereFromParam(q)],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, priceCents: true, coverImage: true, images: true, city: true },
    });
    for (const l of fsbo) {
      const img = l.coverImage ?? (Array.isArray(l.images) && l.images[0] ? String(l.images[0]) : null);
      out.push({
        id: l.id,
        title: l.title,
        href: `/sell/${l.id}`,
        priceLabel: formatCad(l.priceCents),
        image: img,
      });
    }
  } catch {
    /* empty */
  }
  return out;
}

function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}
