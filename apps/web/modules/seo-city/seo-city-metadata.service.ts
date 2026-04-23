import { getCityPageConfig, type CitySlug } from "@/lib/geo/city-search";

import type { SeoMetadataBundle } from "./seo-city.types";

const BRAND = "LECIPM";

function label(slug: CitySlug): string {
  return getCityPageConfig(slug).heroTitle.replace(/^Explore\s+/i, "").trim();
}

export function buildSeoMetadataBundle(input: {
  kind: "CITY" | "NEIGHBORHOOD" | "INVESTMENT" | "BROKER" | "RENTAL" | "RENT";
  citySlug: CitySlug;
  areaName?: string;
  canonicalPath: string;
  introSnippet?: string;
}): SeoMetadataBundle {
  const city = label(input.citySlug);
  const base = getCityPageConfig(input.citySlug);

  let title: string;
  let description: string;
  const kw = [city, "real estate", "LECIPM", "properties", "BNHUB", "Québec", "Canada"];

  switch (input.kind) {
    case "CITY":
      title = `Real estate in ${city} | Buy, sell & book stays | ${BRAND}`;
      description =
        input.introSnippet?.slice(0, 155) ||
        `Explore ${city}: FSBO sales, short stays, and broker tools on ${BRAND} — data-driven, human-reviewed pages.`;
      break;
    case "NEIGHBORHOOD":
      title = `${input.areaName ?? "Neighborhood"} — ${city} | ${BRAND}`;
      description = `Discover ${input.areaName ?? "this area"} in ${city}. Browse stays and home listings with clear next steps.`;
      kw.push(input.areaName ?? "neighborhood");
      break;
    case "INVESTMENT":
      title = `Invest in ${city} real estate | research & inventory | ${BRAND}`;
      description = `Investment angles for ${city}: inventory links, not investment advice. Review opportunities with licensed professionals.`;
      kw.push("invest", "ROI research");
      break;
    case "BROKER":
      title = `Real estate brokers in ${city} | partner with ${BRAND}`;
      description = `How ${BRAND} routes demand to professional brokers in ${city} — transparent workflows, not pay-for-rank.`;
      kw.push("brokers", "agents");
      break;
    case "RENTAL":
    case "RENT":
      title = `Rent & short stays in ${city} | ${BRAND} BNHUB`;
      description = `Find stays and rental discovery paths in ${city}. Check live availability and local rules on listing pages.`;
      kw.push("rent", "short-term rental");
      break;
    default:
      title = base.metaTitle;
      description = base.metaDescription;
  }

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 180),
    keywords: [...new Set(kw)].slice(0, 24),
    openGraph: { title, description, type: "website" },
    alternates: { canonical: input.canonicalPath },
  };
}
