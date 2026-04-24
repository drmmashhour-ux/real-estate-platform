import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { getRegionalConfigForCountryCode } from "@/modules/expansion/local-config.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/expansion/markets — countries, cities, listing counts, merged regional config (admin).
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const countries = await prisma.expansionCountry.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        currency: true,
        isActive: true,
        defaultLocale: true,
        supportedLocales: true,
        regionalConfigJson: true,
      },
    });

    const cities = await prisma.city.findMany({
      orderBy: [{ country: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        region: true,
        status: true,
        isActive: true,
        listingsEnabled: true,
        searchPagesEnabled: true,
        growthEngineEnabled: true,
        expansionCountryId: true,
        expansionCountry: {
          select: { id: true, code: true, name: true, currency: true },
        },
      },
    });

    const cityIds = cities.map((c) => c.id);
    const bnCounts =
      cityIds.length === 0
        ? []
        : await prisma.shortTermListing.groupBy({
            by: ["marketCityId"],
            where: { marketCityId: { in: cityIds }, listingStatus: "PUBLISHED" },
            _count: { _all: true },
          });
    const countByCity = new Map(bnCounts.map((r) => [r.marketCityId, r._count._all]));

    const citiesOut = cities.map((c) => ({
      ...c,
      publishedBnhubListings: countByCity.get(c.id) ?? 0,
    }));

    const readiness = await Promise.all(
      countries.map(async (co) => {
        const { config } = await getRegionalConfigForCountryCode(co.code);
        return { countryId: co.id, code: co.code, enabledFeatures: config.enabledFeatures ?? [] };
      })
    );

    return NextResponse.json({
      success: true,
      countries,
      cities: citiesOut,
      readiness,
    });
  } catch (e) {
    console.error("[expansion/markets]", e);
    return NextResponse.json({ error: "markets_failed" }, { status: 500 });
  }
}
