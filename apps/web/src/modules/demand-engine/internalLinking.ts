import type { CitySlug } from "@/lib/geo/city-search";
import { listNeighborhoodSlugs } from "./neighborhoodRegistry";

export type InternalNavLink = {
  href: string;
  label: string;
  kind: "city" | "buy" | "stays" | "neighborhood" | "invest";
};

/**
 * Programmatic internal links for SEO mesh (city hub ↔ buy ↔ stays ↔ neighborhoods).
 */
export function buildCityInternalLinks(city: CitySlug): InternalNavLink[] {
  const links: InternalNavLink[] = [
    { href: `/city/${city}`, label: `${city} hub`, kind: "city" },
    { href: `/city/${city}/buy`, label: `Buy — SEO hub`, kind: "buy" },
    { href: `/city/${city}/rent`, label: `Rent — SEO hub`, kind: "stays" },
    { href: `/city/${city}/investment`, label: `Invest — ${city}`, kind: "invest" },
    { href: `/buy/${city}`, label: `Buy in ${city}`, kind: "buy" },
    { href: `/bnhub/stays?city=${city}`, label: `Stays in ${city}`, kind: "stays" },
  ];
  for (const n of listNeighborhoodSlugs(city)) {
    links.push({
      href: `/city/${city}/n/${n}`,
      label: n.replace(/-/g, " "),
      kind: "neighborhood",
    });
  }
  return links;
}
