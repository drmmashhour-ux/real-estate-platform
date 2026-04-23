import { getCityPageConfig, type CitySlug } from "@/lib/geo/city-search";
import { getNeighborhoodEntry, listNeighborhoodSlugs } from "@/src/modules/demand-engine/neighborhoodRegistry";

import type { SeoCityMarketStats, SeoContentBlock, SeoCityPageKind } from "./seo-city.types";

function cityLabel(slug: CitySlug): string {
  return getCityPageConfig(slug).heroTitle.replace(/^Explore\s+/i, "").trim();
}

/** Deterministic hash for dedup checks (not crypto) */
export function contentFingerprint(slug: CitySlug, kind: SeoCityPageKind, area?: string): string {
  return `${slug}:${kind}:${area ?? ""}:v1`;
}

export function buildCityIntroBlocks(slug: CitySlug, stats: SeoCityMarketStats | null): SeoContentBlock[] {
  const label = cityLabel(slug);
  const statLine =
    stats && stats.fsboCount + stats.bnhubCount > 0
      ? `As of our last scan, LECIPM shows ${stats.fsboCount} public sale listings and ${stats.bnhubCount} published stays in the ${label} search area — figures change as inventory updates.`
      : "Inventory updates frequently; browse live results to see what is available today.";

  return [
    {
      id: "intro",
      type: "intro",
      title: `Real estate in ${label}`,
      body: `${statLine} This section adds structured context without repeating the hero — see live inventory below for current stock.`,
    },
    {
      id: "market",
      type: "stats",
      title: "Market overview",
      body:
        stats?.avgPriceCentsFsbo != null
          ? `Average asking price (FSBO sample on platform): ${formatCad(stats.avgPriceCentsFsbo)} — indicative only, not an appraisal.`
          : "When enough listings are available, we surface average price ranges here to orient research (not a valuation).",
    },
    {
      id: "nbh",
      type: "neighborhoods",
      title: "Popular areas to explore",
      body: `Use neighborhood pages for focused search and BNHUB discovery — each page links to filters so you avoid generic landing spam.`,
      items: listNeighborhoodSlugs(slug)
        .slice(0, 8)
        .map((a) => getNeighborhoodEntry(slug, a)?.title ?? a.replace(/-/g, " ")),
    },
    {
      id: "cta",
      type: "cta",
      title: "Next step",
      body: `Compare stays, FSBO inventory, and broker-led options in ${label}. Save listings and contact sellers or hosts when you are ready.`,
    },
  ];
}

export function buildNeighborhoodBlocks(
  slug: CitySlug,
  areaTitle: string,
  areaDescription: string
): SeoContentBlock[] {
  return [
    {
      id: "n-intro",
      type: "intro",
      title: areaTitle,
      body: `${areaDescription} Use on-site search to align availability with your dates and budget.`,
    },
    {
      id: "n-life",
      type: "bullets",
      title: "Lifestyle & property mix",
      body: "Areas differ by housing stock and transit — verify schools, noise, and bylaws independently before you offer.",
      items: ["Condos & plexes near cores", "Single-family pockets", "Transit-linked corridors"],
    },
  ];
}

export function buildInvestmentBlocks(slug: CitySlug): SeoContentBlock[] {
  const label = cityLabel(slug);
  return [
    {
      id: "inv-why",
      type: "invest",
      title: `Why investors research ${label}`,
      body: `Macro demand, employment, and rental liquidity vary by block — LECIPM surfaces inventory and tools; returns are never guaranteed.`,
    },
    {
      id: "inv-roi",
      type: "bullets",
      title: "How to think about ROI (high level)",
      body: "Use rent vs price, carrying cost, and vacancy risk — work with licensed professionals for underwriting.",
      items: ["Start with realistic rent comps", "Include tax and maintenance", "Stress-test vacancy"],
    },
  ];
}

export function buildBrokerBlocks(slug: CitySlug): SeoContentBlock[] {
  const label = cityLabel(slug);
  return [
    {
      id: "br-intro",
      type: "brokers",
      title: `Brokers in ${label}`,
      body: `LECIPM routes serious intent to partner brokers where the product is live. Expect transparent handoffs and CRM-friendly workflows — not pay-to-rank lead spam.`,
    },
    {
      id: "br-how",
      type: "bullets",
      title: "How brokers win clients here",
      body: "Quality routing beats volume games when buyers and sellers expect clarity.",
      items: ["Routed demand from search & city hubs", "Tools for short stays + resales in one stack", "Training resources in partner programs"],
    },
  ];
}

export function buildRentalBlocks(slug: CitySlug, variant: "RENT" | "RENTAL"): SeoContentBlock[] {
  const label = cityLabel(slug);
  const title =
    variant === "RENTAL"
      ? `Short stays & rentals in ${label}`
      : `Rent in ${label} — start your search`;
  return [
    {
      id: "rent-intro",
      type: "rental",
      title,
      body: `BNHUB highlights curated short-term inventory; for traditional leases use dedicated filters where available. Always confirm house rules and local requirements.`,
    },
  ];
}

function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}
