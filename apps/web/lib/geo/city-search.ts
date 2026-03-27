import type { Prisma } from "@prisma/client";

/** URL slugs and supported `?city=` values (case-insensitive). */
export const CITY_SLUGS = ["montreal", "laval", "quebec"] as const;
export type CitySlug = (typeof CITY_SLUGS)[number];

function foldCityInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_]+/g, "-");
}

/**
 * Resolve supported marketing slugs; null = treat as free-text city search.
 */
export function normalizeCitySlug(input: string | null | undefined): CitySlug | null {
  if (input == null || typeof input !== "string") return null;
  const t = foldCityInput(input);
  if (t === "montreal" || t === "montréal" || t === "mont-real") return "montreal";
  if (t === "laval") return "laval";
  if (
    t === "quebec" ||
    t === "quebec-city" ||
    t === "quebeccity" ||
    t === "ville-de-quebec" ||
    t === "quebec-qc"
  ) {
    return "quebec";
  }
  return null;
}

/** BNHub / ShortTermListing city OR (accent / naming variants). */
export function shortTermListingCityOrConditions(
  slug: CitySlug
): Prisma.ShortTermListingWhereInput[] {
  switch (slug) {
    case "montreal":
      return [
        { city: { contains: "Montreal", mode: "insensitive" } },
        { city: { contains: "Montréal", mode: "insensitive" } },
      ];
    case "laval":
      return [{ city: { contains: "Laval", mode: "insensitive" } }];
    case "quebec":
      return [
        { city: { contains: "Quebec", mode: "insensitive" } },
        { city: { contains: "Québec", mode: "insensitive" } },
        { city: { contains: "Quebec City", mode: "insensitive" } },
      ];
  }
}

/**
 * If `raw` matches a known slug, return OR clauses for BNHub; else null (use plain contains).
 */
export function getShortTermCityOrFromParam(
  raw: string
): Prisma.ShortTermListingWhereInput[] | null {
  const slug = normalizeCitySlug(raw);
  if (!slug) return null;
  return shortTermListingCityOrConditions(slug);
}

/** FSBO city clause: known slug → OR variants; else insensitive contains. */
export function fsboCityWhereFromParam(cityRaw: string): Prisma.FsboListingWhereInput {
  const trimmed = cityRaw.trim();
  if (!trimmed) return {};
  const slug = normalizeCitySlug(trimmed);
  if (slug) {
    return { OR: shortTermListingCityOrConditions(slug) as Prisma.FsboListingWhereInput[] };
  }
  return { city: { contains: trimmed, mode: "insensitive" } };
}

export type CityPageConfig = {
  slug: CitySlug;
  exploreTitle: string;
  heroTitle: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  /** Pass-through for `?city=` / `?location=` */
  searchQuery: string;
};

export function getCityPageConfig(slug: CitySlug): CityPageConfig {
  switch (slug) {
    case "montreal":
      return {
        slug: "montreal",
        exploreTitle: "Explore Montreal",
        heroTitle: "Explore Montreal",
        description:
          "Montreal is one of Canada's most dynamic cities — a bilingual hub for culture, innovation, and resilient housing demand. From the vibrant downtown core to established neighbourhoods and transit-oriented corridors, the region offers diverse opportunities for buyers, hosts, and investors.",
        heroImage: "/images/montreal/montreal-hero.jpg",
        heroImageAlt: "Montreal skyline",
        metaTitle: "Real Estate in Montreal | LECIPM",
        metaDescription:
          "Find properties, stays, and investment opportunities in Montreal.",
        searchQuery: "montreal",
      };
    case "laval":
      return {
        slug: "laval",
        exploreTitle: "Explore Laval",
        heroTitle: "Explore Laval",
        description:
          "Laval is a fast-growing city just north of Montreal — families, commuters, and new developments shape one of Québec's most active suburban markets. Strong demand for well-priced housing, proximity to highways and transit, and ongoing investment make Laval a natural focus on LECIPM.",
        heroImage: "/images/laval/laval-hero.jpg",
        heroImageAlt: "Laval region",
        metaTitle: "Real Estate in Laval | LECIPM",
        metaDescription:
          "Find properties, stays, and investment opportunities in Laval.",
        searchQuery: "laval",
      };
    case "quebec":
      return {
        slug: "quebec",
        exploreTitle: "Explore Quebec",
        heroTitle: "Explore Quebec",
        description:
          "Québec offers stability, quality of life, and strong real estate opportunities. From Quebec City to the wider region, LECIPM connects you with verified stays (BNHub) and direct-sale homes (FSBO).",
        heroImage: "/images/laval/laval-city.jpg",
        heroImageAlt: "Quebec landscape and cities",
        metaTitle: "Real Estate in Quebec | LECIPM",
        metaDescription:
          "Find properties, stays, and investment opportunities in Quebec.",
        searchQuery: "quebec",
      };
  }
}

export function parseCitySlugParam(param: string | undefined): CitySlug | null {
  if (!param?.trim()) return null;
  return normalizeCitySlug(param);
}
