import type { CitySlug } from "@/lib/geo/city-search";

export type NeighborhoodEntry = {
  slug: string;
  title: string;
  description: string;
  /** Optional search hint for BNHUB / FSBO */
  searchHint: string;
};

/** Curated demand pages — extend per `launchCity`. */
export const NEIGHBORHOODS_BY_CITY: Record<CitySlug, NeighborhoodEntry[]> = {
  montreal: [
    {
      slug: "plateau",
      title: "Plateau Mont-Royal",
      description:
        "Walkable streets, cafés, and strong short-term demand — a core BNHUB corridor for guests and investors.",
      searchHint: "plateau",
    },
    {
      slug: "downtown",
      title: "Downtown Montreal",
      description: "Business travel, events, and high-intent stays — central demand aggregation for the metro.",
      searchHint: "downtown",
    },
    {
      slug: "old-port",
      title: "Old Montreal",
      description: "Heritage tourism and premium weekend demand — ideal for curated supply and trust-forward listings.",
      searchHint: "vieux",
    },
  ],
  laval: [
    {
      slug: "chomedey",
      title: "Chomedey",
      description: "Family-friendly suburban demand with commuter links — expand supply with verified hosts.",
      searchHint: "chomedey",
    },
    {
      slug: "carrefour",
      title: "Carrefour Laval corridor",
      description: "Retail and services anchor steady regional traffic — good for mid-week stays.",
      searchHint: "laval",
    },
  ],
  quebec: [
    {
      slug: "old-quebec",
      title: "Old Quebec",
      description: "Heritage tourism and international demand — premium trust and exclusive inventory play well here.",
      searchHint: "vieux quebec",
    },
    {
      slug: "saint-roch",
      title: "Saint-Roch",
      description: "Urban renewal and creative economy — rising lead flow for mixed stays and projects.",
      searchHint: "saint-roch",
    },
  ],
};

export function getNeighborhoodEntry(city: CitySlug, areaSlug: string): NeighborhoodEntry | null {
  const list = NEIGHBORHOODS_BY_CITY[city] ?? [];
  return list.find((n) => n.slug === areaSlug) ?? null;
}

export function listNeighborhoodSlugs(city: CitySlug): string[] {
  return (NEIGHBORHOODS_BY_CITY[city] ?? []).map((n) => n.slug);
}
