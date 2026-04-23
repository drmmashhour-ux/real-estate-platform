import { getCityPageConfig, type CitySlug } from "@/lib/geo/city-search";
import { buildCityInternalLinks } from "@/src/modules/demand-engine/internalLinking";
import { listNeighborhoodSlugs } from "@/src/modules/demand-engine/neighborhoodRegistry";

import { buildSeoMetadataBundle } from "./seo-city-metadata.service";
import {
  buildBrokerBlocks,
  buildCityIntroBlocks,
  buildInvestmentBlocks,
  buildNeighborhoodBlocks,
  buildRentalBlocks,
  contentFingerprint,
} from "./seo-city-content.service";
import { fetchSeoCityMarketStats, fetchSeoListingsPreview } from "./seo-city-pages.service";
import { citySeoSegmentPath, neighborhoodPath } from "./seo-city-routing.service";

import type { SeoCityPageModel, SeoPageOverrides } from "./seo-city.types";

const OVERRIDE_KEY = "lecipm-seo-city-overrides-v1";

function readOverridesClient(country: string, slug: CitySlug, kind: string): SeoPageOverrides | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const r = localStorage.getItem(OVERRIDE_KEY);
    if (!r) return null;
    const all = JSON.parse(r) as Record<string, SeoPageOverrides>;
    return all[`${country}:${slug}:${kind}`] ?? null;
  } catch {
    return null;
  }
}

export { readOverridesClient as readSeoCityOverrides };

export function writeSeoCityOverrideClient(
  country: string,
  slug: CitySlug,
  kind: string,
  patch: SeoPageOverrides
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const r = localStorage.getItem(OVERRIDE_KEY);
    const all = (r ? JSON.parse(r) : {}) as Record<string, SeoPageOverrides>;
    all[`${country}:${slug}:${kind}`] = { ...all[`${country}:${slug}:${kind}`], ...patch };
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}

function internalLinksForCity(
  slug: CitySlug
): { label: string; href: string; rel?: string }[] {
  const base = buildCityInternalLinks(slug);
  const out = base.map((l) => ({ label: l.label, href: l.href }));
  for (const n of listNeighborhoodSlugs(slug).slice(0, 6)) {
    out.push({
      label: n.replace(/-/g, " "),
      href: neighborhoodPath(slug, n),
    });
  }
  out.push(
    { label: "Investment", href: citySeoSegmentPath(slug, "investment") },
    { label: "Brokers", href: citySeoSegmentPath(slug, "brokers") },
    { label: "Stays (BNHUB)", href: citySeoSegmentPath(slug, "rentals") }
  );
  return out;
}

export async function generateSeoCityModel(
  kind: SeoCityPageModel["kind"],
  citySlug: CitySlug,
  opts?: { areaSlug?: string; areaTitle?: string; areaDescription?: string }
): Promise<SeoCityPageModel> {
  const stats = await fetchSeoCityMarketStats(citySlug);
  const listingPreview = await fetchSeoListingsPreview(citySlug);

  let content: import("./seo-city.types").SeoContentBlock[] = [];
  if (kind === "CITY") content = buildCityIntroBlocks(citySlug, stats);
  else if (kind === "NEIGHBORHOOD" && opts?.areaTitle && opts.areaDescription) {
    content = buildNeighborhoodBlocks(citySlug, opts.areaTitle, opts.areaDescription);
  } else if (kind === "INVESTMENT") content = buildInvestmentBlocks(citySlug);
  else if (kind === "BROKER") content = buildBrokerBlocks(citySlug);
  else if (kind === "RENTAL" || kind === "RENT") {
    content = buildRentalBlocks(citySlug, kind === "RENTAL" ? "RENTAL" : "RENT");
  }

  const path =
    kind === "NEIGHBORHOOD" && opts?.areaSlug
      ? neighborhoodPath(citySlug, opts.areaSlug)
      : kind === "INVESTMENT"
        ? citySeoSegmentPath(citySlug, "investment")
        : kind === "BROKER"
          ? citySeoSegmentPath(citySlug, "brokers")
          : kind === "RENTAL"
            ? citySeoSegmentPath(citySlug, "rentals")
            : kind === "RENT"
              ? citySeoSegmentPath(citySlug, "rent")
              : citySeoSegmentPath(citySlug, "");

  return {
    kind,
    citySlug,
    areaSlug: opts?.areaSlug,
    content,
    stats,
    listingPreview,
    internalLinks: internalLinksForCity(citySlug),
    uniqueContentHash: contentFingerprint(citySlug, kind, opts?.areaSlug),
  };
}

function mapModelKind(
  k: SeoCityPageModel["kind"]
):
  | "CITY"
  | "NEIGHBORHOOD"
  | "INVESTMENT"
  | "BROKER"
  | "RENTAL"
  | "RENT" {
  return k;
}

export function metadataForSeoModel(
  model: SeoCityPageModel,
  canonicalPath: string,
  areaName?: string
) {
  return buildSeoMetadataBundle({
    kind: mapModelKind(model.kind),
    citySlug: model.citySlug,
    areaName,
    canonicalPath,
    introSnippet: getCityPageConfig(model.citySlug).description,
  });
}
