import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CITY_SLUGS, shortTermListingCityOrConditions } from "@/lib/geo/city-search";
import type { CitySlug } from "@/lib/geo/city-search";
import { ListingStatus } from "@prisma/client";

export type CompetitorSnapshotInput = {
  citySlug: string;
  competitorKey: string;
  competitorEstimate?: number | null;
  avgPriceCentsTheirs?: number | null;
  featureGaps?: Record<string, unknown> | null;
  /** When set (or when citySlug is a known slug), platform aggregates are computed. */
  knownCitySlug?: CitySlug;
};

function isCitySlug(s: string): s is CitySlug {
  return (CITY_SLUGS as readonly string[]).includes(s);
}

/**
 * Persist a competitor / gap snapshot (admin or cron).
 */
export async function recordCompetitorSnapshot(input: CompetitorSnapshotInput) {
  const slug = input.knownCitySlug ?? (isCitySlug(input.citySlug) ? input.citySlug : undefined);

  let platformListingCount: number | null = null;
  let avgOurs: number | null = null;

  if (slug) {
    const or = shortTermListingCityOrConditions(slug);
    platformListingCount = await prisma.shortTermListing.count({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        OR: or,
      },
    });

    const priceAgg = await prisma.shortTermListing.aggregate({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        OR: or,
      },
      _avg: { nightPriceCents: true },
    });
    avgOurs = priceAgg._avg.nightPriceCents != null ? Math.round(priceAgg._avg.nightPriceCents) : null;
  }

  return prisma.monopolyCompetitorSnapshot.create({
    data: {
      citySlug: input.citySlug,
      competitorKey: input.competitorKey,
      platformListingCount,
      competitorEstimate: input.competitorEstimate ?? null,
      avgPriceCentsOurs: avgOurs,
      avgPriceCentsTheirs: input.avgPriceCentsTheirs ?? null,
      featureGapJson: (input.featureGaps ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listLatestCompetitorSnapshots(citySlug: string, take = 5) {
  return prisma.monopolyCompetitorSnapshot.findMany({
    where: { citySlug },
    orderBy: { recordedAt: "desc" },
    take,
  });
}
