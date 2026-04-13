import type { CitySlug } from "@/lib/geo/city-search";
import { getCityPageConfig } from "@/lib/geo/city-search";

/** Map slug to search query for links */
export function citySlugToSearchQuery(slug: CitySlug): string {
  return getCityPageConfig(slug).searchQuery;
}
