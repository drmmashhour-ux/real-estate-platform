import { notFound, permanentRedirect } from "next/navigation";
import { CITY_SLUGS, type CitySlug } from "@/lib/geo/city-search";
import { NEIGHBORHOODS_BY_CITY } from "@/src/modules/demand-engine/neighborhoodRegistry";

type Props = { params: Promise<{ name: string }> };

function resolveNeighborhood(slug: string): { city: CitySlug; area: string } | null {
  const fold = slug.trim().toLowerCase();
  for (const city of CITY_SLUGS) {
    const hit = NEIGHBORHOODS_BY_CITY[city].find((n) => n.slug === fold);
    if (hit) return { city, area: hit.slug };
  }
  return null;
}

/** SEO alias: `/neighborhood/[name]` → canonical `/city/[city]/n/[area]`. */
export default async function NeighborhoodNamePage({ params }: Props) {
  const { name } = await params;
  const resolved = resolveNeighborhood(name);
  if (!resolved) notFound();
  permanentRedirect(`/city/${resolved.city}/n/${resolved.area}`);
}
