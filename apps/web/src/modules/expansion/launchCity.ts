import { prisma } from "@/lib/db";
import { normalizeCitySlug, type CitySlug } from "@/lib/geo/city-search";
import { listNeighborhoodSlugs } from "@/src/modules/demand-engine/neighborhoodRegistry";

function slugifyCityName(cityName: string): string {
  return cityName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type LaunchCityResult = {
  slug: string;
  displayName: string;
  alreadyExisted: boolean;
  pagesActivated: string[];
  neighborhoodsActivated: string[];
  campaignsActivated: boolean;
};

/**
 * Expansion engine: register a city, expose SEO surface area, flip campaign flag.
 * Known `CitySlug` values align with `/city/[city]` static params; unknown names still persist for ops tracking.
 */
export async function launchCity(cityName: string): Promise<LaunchCityResult> {
  const displayName = cityName.trim() || "Unknown";
  const normalized = normalizeCitySlug(displayName);
  const slug = (normalized ?? slugifyCityName(displayName)) as string;

  const existing = await prisma.monopolyExpansionCity.findUnique({ where: { slug } });
  if (!existing) {
    await prisma.monopolyExpansionCity.create({
      data: {
        displayName,
        slug,
        seoPath: `/city/${slug}`,
        campaignsEnabled: true,
      },
    });
  }

  const pagesActivated = [`/city/${slug}`, `/buy/${slug}`, `/bnhub/stays?city=${slug}`];
  const neighborhoodsActivated =
    normalized != null ? listNeighborhoodSlugs(normalized as CitySlug).map((n) => `/city/${slug}/n/${n}`) : [];

  return {
    slug,
    displayName,
    alreadyExisted: Boolean(existing),
    pagesActivated,
    neighborhoodsActivated,
    campaignsActivated: true,
  };
}
