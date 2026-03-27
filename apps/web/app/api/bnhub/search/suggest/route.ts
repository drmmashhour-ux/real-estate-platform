import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeListingCode } from "@/lib/listing-code";

export const dynamic = "force-dynamic";

const CITY_CACHE: { at: number; cities: string[] } = { at: 0, cities: [] };
const CITY_TTL_MS = 5 * 60 * 1000;

async function loadCities(): Promise<string[]> {
  if (Date.now() - CITY_CACHE.at < CITY_TTL_MS && CITY_CACHE.cities.length) {
    return CITY_CACHE.cities;
  }
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED" },
    select: { city: true },
    distinct: ["city"],
    take: 500,
  });
  const cities = [...new Set(rows.map((r) => r.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  CITY_CACHE.at = Date.now();
  CITY_CACHE.cities = cities;
  return cities;
}

/**
 * GET /api/bnhub/search/suggest?q= — cities + listing title/code matches + recent is client-only.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q || q.length < 2) {
    return Response.json({ cities: [], listings: [] });
  }

  const code = normalizeListingCode(q);
  const citiesAll = await loadCities();
  const qLower = q.toLowerCase();
  const cities = citiesAll.filter((c) => c.toLowerCase().includes(qLower)).slice(0, 10);

  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        ...(code ? [{ listingCode: { equals: code, mode: "insensitive" as const } }] : []),
        { listingCode: { contains: q.replace(/\s/g, ""), mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ cities, listings });
}
