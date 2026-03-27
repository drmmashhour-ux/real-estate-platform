import type { Prisma } from "@prisma/client";
import { ListingStatus } from "@prisma/client";

/** 100K domination rollout — Montreal core → Canada. See docs/100k-domination-system.md */
export type DominationCityKey = "montreal" | "laval" | "quebec-city" | "toronto" | "vancouver";

export type DominationCityConfig = {
  key: DominationCityKey;
  /** URL segment for shared page */
  slug: string;
  displayName: string;
  country: string;
  metaTitle: string;
  metaDescription: string;
  /** Prisma filter for `ShortTermListing` rows in this market */
  listingWhere: Prisma.ShortTermListingWhereInput;
};

function published(where: Prisma.ShortTermListingWhereInput): Prisma.ShortTermListingWhereInput {
  return {
    listingStatus: ListingStatus.PUBLISHED,
    ...where,
  };
}

export const DOMINATION_CITIES: Record<DominationCityKey, DominationCityConfig> = {
  montreal: {
    key: "montreal",
    slug: "montreal",
    displayName: "Montreal",
    country: "CA",
    metaTitle: "BNHub Stays in Montreal | Verified short-term rentals",
    metaDescription:
      "Search stays in Montreal — verified hosts, clear pricing, book with confidence. List your property and reach travelers.",
    listingWhere: published({
      OR: [
        { city: { contains: "Montreal", mode: "insensitive" } },
        { city: { contains: "Montréal", mode: "insensitive" } },
      ],
    }),
  },
  laval: {
    key: "laval",
    slug: "laval",
    displayName: "Laval",
    country: "CA",
    metaTitle: "BNHub Stays in Laval | Short-term rentals near Montreal",
    metaDescription: "Discover stays in Laval — family-friendly homes and commutable to Montreal. Hosts: list with launch support.",
    listingWhere: published({
      city: { contains: "Laval", mode: "insensitive" },
    }),
  },
  "quebec-city": {
    key: "quebec-city",
    slug: "quebec-city",
    displayName: "Quebec City",
    country: "CA",
    metaTitle: "BNHub Stays in Quebec City | Short-term rentals",
    metaDescription: "Stays in Québec City — culture, history, verified listings. Hosts welcome.",
    listingWhere: published({
      OR: [
        { city: { contains: "Quebec", mode: "insensitive" } },
        { city: { contains: "Québec", mode: "insensitive" } },
        { city: { contains: "Quebec City", mode: "insensitive" } },
      ],
    }),
  },
  toronto: {
    key: "toronto",
    slug: "toronto",
    displayName: "Toronto",
    country: "CA",
    metaTitle: "BNHub Stays in Toronto | Short-term rentals",
    metaDescription: "Find verified short-term rentals in Toronto. Strong demand — list your space on BNHub.",
    listingWhere: published({
      OR: [
        { city: { contains: "Toronto", mode: "insensitive" } },
        { city: { contains: "GTA", mode: "insensitive" } },
      ],
    }),
  },
  vancouver: {
    key: "vancouver",
    slug: "vancouver",
    displayName: "Vancouver",
    country: "CA",
    metaTitle: "BNHub Stays in Vancouver | Short-term rentals",
    metaDescription: "Stays in Vancouver and Lower Mainland — mountains, coast, verified hosts.",
    listingWhere: published({
      OR: [
        { city: { contains: "Vancouver", mode: "insensitive" } },
        { city: { contains: "Burnaby", mode: "insensitive" } },
        { city: { contains: "Richmond", mode: "insensitive" } },
      ],
    }),
  },
};

export const DOMINATION_CITY_ORDER: DominationCityKey[] = [
  "montreal",
  "laval",
  "quebec-city",
  "toronto",
  "vancouver",
];
