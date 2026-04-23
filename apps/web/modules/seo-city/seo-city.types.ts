import type { CitySlug } from "@/lib/geo/city-search";

export type SeoCityPageKind =
  | "CITY"
  | "NEIGHBORHOOD"
  | "INVESTMENT"
  | "BROKER"
  | "RENTAL"
  | "RENT" /** legacy segment — canonical sibling */;

export type SeoContentBlock = {
  id: string;
  type: "intro" | "stats" | "neighborhoods" | "listings" | "cta" | "bullets" | "invest" | "brokers" | "rental";
  title?: string;
  body: string;
  items?: string[];
};

export type SeoCityListingsPreview = {
  id: string;
  title: string;
  href: string;
  priceLabel: string;
  image?: string | null;
};

export type SeoCityMarketStats = {
  citySlug: CitySlug;
  fsboCount: number;
  bnhubCount: number;
  avgPriceCentsFsbo: number | null;
  avgNightCentsBnhub: number | null;
  generatedAtIso: string;
};

export type SeoCityPageModel = {
  kind: SeoCityPageKind;
  citySlug: CitySlug;
  areaSlug?: string;
  content: SeoContentBlock[];
  stats: SeoCityMarketStats | null;
  listingPreview: SeoCityListingsPreview[];
  internalLinks: { label: string; href: string; rel?: string }[];
  uniqueContentHash: string;
};

export type SeoPageOverrides = {
  /** Disable generated page (returns minimal safe copy if checked client-side) */
  disabled?: boolean;
  titleSuffix?: string;
  introOverride?: string;
  metaDescriptionOverride?: string;
};

export type SeoMetadataBundle = {
  title: string;
  description: string;
  keywords: string[];
  openGraph: { title: string; description: string; type: "website" };
  /** Avoid duplicate with sibling routes */
  alternates?: { canonical?: string };
};
