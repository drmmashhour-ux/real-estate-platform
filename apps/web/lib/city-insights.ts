/**
 * Aggregated market stats for LECIPM city pages (BNHUB + FSBO).
 * Cached via Next unstable_cache — safe for server components.
 */

import { unstable_cache } from "next/cache";
import type { CitySlug } from "@/lib/geo/city-search";
import { CITY_SLUGS, fsboCityWhereFromParam, getCityPageConfig } from "@/lib/geo/city-search";
import { buildPublishedListingSearchWhere } from "@/lib/bnhub/build-search-where";
import { prisma } from "@/lib/db";

const REVALIDATE_SEC = 300;

export type CityInsightsPayload = {
  slug: CitySlug;
  /** Average FSBO ask (full property), cents */
  avgPropertyPriceCents: number | null;
  /** Average BNHUB nightly rate, cents */
  avgNightlyPriceCents: number | null;
  activeBnhubCount: number;
  activeFsboCount: number;
  /** Blended avg bedrooms (FSBO bedrooms + BNHUB beds) */
  avgBedrooms: number | null;
  /**
   * Simple model: (avgNight * 365 * occupancy) / avg FSBO price.
   * Occupancy assumed 50% when no booking history slice — clearly approximate.
   */
  estimatedYieldPercent: number | null;
  /** Heuristic 0–100 from volume, yield, balance of inventory */
  investmentScore: number;
  /** User-facing note when numbers are thin */
  yieldNote: string | null;
};

const OCCUPANCY_ASSUMPTION = 0.5;

async function computeCityInsightsUncached(slug: CitySlug): Promise<CityInsightsPayload> {
  const { searchQuery } = getCityPageConfig(slug);
  const bnWhere = buildPublishedListingSearchWhere({ city: searchQuery });
  const fsboBase = {
    AND: [{ status: "ACTIVE" as const }, { moderationStatus: "APPROVED" as const }, fsboCityWhereFromParam(searchQuery)],
  };
  const fsboWithBedsWhere = {
    AND: [...fsboBase.AND, { bedrooms: { not: null } }],
  };

  const [
    activeBnhubCount,
    activeFsboCount,
    bnPriceAgg,
    bnBedsAgg,
    fsboPriceAgg,
    fsboBedAgg,
  ] = await Promise.all([
    prisma.shortTermListing.count({ where: bnWhere }),
    prisma.fsboListing.count({ where: fsboBase }),
    prisma.shortTermListing.aggregate({
      where: bnWhere,
      _avg: { nightPriceCents: true },
    }),
    prisma.shortTermListing.aggregate({
      where: bnWhere,
      _avg: { beds: true },
    }),
    prisma.fsboListing.aggregate({
      where: fsboBase,
      _avg: { priceCents: true },
    }),
    prisma.fsboListing.aggregate({
      where: fsboWithBedsWhere,
      _avg: { bedrooms: true },
    }),
  ]);

  const avgNightlyPriceCents = bnPriceAgg._avg.nightPriceCents;
  const avgPropertyPriceCents = fsboPriceAgg._avg.priceCents;

  let avgBedrooms: number | null = null;
  const parts: { sum: number; n: number }[] = [];
  if (bnBedsAgg._avg.beds != null && activeBnhubCount > 0) {
    parts.push({ sum: bnBedsAgg._avg.beds * activeBnhubCount, n: activeBnhubCount });
  }
  if (fsboBedAgg._avg.bedrooms != null) {
    const fsboWithBeds = await prisma.fsboListing.count({
      where: fsboWithBedsWhere,
    });
    if (fsboWithBeds > 0) {
      parts.push({ sum: (fsboBedAgg._avg.bedrooms as number) * fsboWithBeds, n: fsboWithBeds });
    }
  }
  const totalN = parts.reduce((a, p) => a + p.n, 0);
  if (totalN > 0) {
    avgBedrooms = parts.reduce((a, p) => a + p.sum, 0) / totalN;
  }

  let estimatedYieldPercent: number | null = null;
  let yieldNote: string | null = null;

  if (
    avgNightlyPriceCents != null &&
    avgNightlyPriceCents > 0 &&
    avgPropertyPriceCents != null &&
    avgPropertyPriceCents > 0
  ) {
    const grossAnnualCents = avgNightlyPriceCents * 365 * OCCUPANCY_ASSUMPTION;
    estimatedYieldPercent = (grossAnnualCents / avgPropertyPriceCents) * 100;
    if (estimatedYieldPercent > 25) {
      estimatedYieldPercent = Math.min(estimatedYieldPercent, 25);
      yieldNote = "Yield capped for display — verify with local rents and expenses.";
    }
  } else {
    yieldNote =
      activeBnhubCount === 0 || activeFsboCount === 0
        ? "Not enough overlapping FSBO and BNHUB data for a yield estimate."
        : null;
  }

  let investmentScore = 35;
  investmentScore += Math.min(25, activeBnhubCount * 2);
  investmentScore += Math.min(20, activeFsboCount * 3);
  if (estimatedYieldPercent != null) {
    investmentScore += Math.min(20, Math.round(estimatedYieldPercent * 2));
  }
  if (activeBnhubCount + activeFsboCount < 4) {
    investmentScore = Math.min(investmentScore, 55);
    if (!yieldNote) yieldNote = "Limited listings — score reflects early-market data.";
  }
  investmentScore = Math.max(0, Math.min(100, investmentScore));

  return {
    slug,
    avgPropertyPriceCents: avgPropertyPriceCents != null ? Math.round(avgPropertyPriceCents) : null,
    avgNightlyPriceCents: avgNightlyPriceCents != null ? Math.round(avgNightlyPriceCents) : null,
    activeBnhubCount,
    activeFsboCount,
    avgBedrooms: avgBedrooms != null ? Math.round(avgBedrooms * 10) / 10 : null,
    estimatedYieldPercent:
      estimatedYieldPercent != null ? Math.round(estimatedYieldPercent * 10) / 10 : null,
    investmentScore,
    yieldNote,
  };
}

export async function getCityInsights(slug: CitySlug): Promise<CityInsightsPayload> {
  if (!CITY_SLUGS.includes(slug)) {
    throw new Error(`Unsupported city slug: ${slug}`);
  }
  return unstable_cache(
    async () => computeCityInsightsUncached(slug),
    ["city-insights-v1", slug],
    { revalidate: REVALIDATE_SEC }
  )();
}

export type WhyInvestContent = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

export function getWhyInvestContent(slug: CitySlug): WhyInvestContent {
  switch (slug) {
    case "montreal":
      return {
        heading: "Why invest in Montreal",
        paragraphs: [
          "Montreal combines Canada’s second-largest metro economy with deep rental demand from students, tech, and tourism. Transit-linked neighbourhoods and a resilient short-term market support both long-hold equity and active hosting strategies.",
        ],
        bullets: [
          "Diverse employment base and major universities",
          "Strong hospitality and events calendar for short-term demand",
          "Compare FSBO asks with BNHUB nightly rates before you buy",
        ],
      };
    case "laval":
      return {
        heading: "Why invest in Laval",
        paragraphs: [
          "Laval offers suburban scale with quick access to Montreal — attractive for families and commuters. Lower entry points than the island can pair with healthy rent-to-price dynamics when inventory is well maintained.",
        ],
        bullets: [
          "Growing residential stock and highway/transit links",
          "Family-oriented demand supports longer leases",
          "Review local FSBO inventory alongside regional BNHUB rates",
        ],
      };
    case "quebec":
      return {
        heading: "Why invest in Quebec",
        paragraphs: [
          "From Quebec City to the wider region, markets benefit from institutional stability, tourism, and provincial fundamentals. Short-term and long-term strategies both merit disciplined underwriting and local broker guidance.",
        ],
        bullets: [
          "Provincial capital and regional hubs anchor demand",
          "Regulatory clarity when working with licensed professionals",
          "Use city insights as a starting point — not a substitute for advice",
        ],
      };
  }
}
