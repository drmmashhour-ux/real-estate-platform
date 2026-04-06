import type { GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { GROWTH_CITY_SLUGS } from "@/lib/growth/geo-slugs";
import { growthCityDisplayName } from "@/lib/growth/geo-slugs";

export type GrowthMeshLink = { href: string; label: string };

/** SEO mesh: city hub ↔ programmatic intents ↔ legacy /buy /rent /mortgage ↔ blog. */
export function buildGrowthSeoMeshLinks(slug: GrowthCitySlug): GrowthMeshLink[] {
  const city = growthCityDisplayName(slug);
  return [
    { href: `/city/${slug}`, label: `${city} hub` },
    { href: `/city/${slug}/buy`, label: `Buy — ${city}` },
    { href: `/city/${slug}/rent`, label: `Rent — ${city}` },
    { href: `/city/${slug}/investment`, label: `Invest — ${city}` },
    { href: `/buy/${slug}`, label: `Buy (classic URL)` },
    { href: `/rent/${slug}`, label: `Rent (classic URL)` },
    { href: `/stays/${slug}`, label: `Stays — ${city}` },
    { href: `/mortgage/${slug}`, label: `Mortgage — ${city}` },
    { href: "/blog", label: "LECIPM blog" },
  ];
}

export function otherGrowthCityLinks(exclude: GrowthCitySlug): GrowthMeshLink[] {
  return GROWTH_CITY_SLUGS.filter((s) => s !== exclude).map((s) => ({
    href: `/city/${s}`,
    label: growthCityDisplayName(s),
  }));
}
