import "server-only";

import { computeListingReputationFromMetrics } from "@/lib/ai/reputationScoringCore";
import { getEarlyUserSignals } from "@/lib/growth/earlyUserSignals";
import { flags } from "@/lib/flags";
import { getCityPricingRecommendations } from "@/lib/market/cityPricingEngine";
import { getDemandHeatmap, type DemandHeatmapRow } from "@/lib/market/demandHeatmap";
import { getListingPricingRecommendations } from "@/lib/market/listingPricingEngine";
import { getCampaignOptimizationInsightsForMarketplace } from "@/lib/marketing/campaignOptimizer";
import { query } from "@/lib/sql";

/**
 * Central intelligence summary (Order 49). Recommendations only — no writes.
 */
export type MarketplaceBrainSummary = {
  demand: {
    hotCities: string[];
    weakCities: string[];
  };
  pricing: {
    increaseCount: number;
    decreaseCount: number;
  };
  reputation: {
    trustedListingCount: number;
    lowTrustListingCount: number;
  };
  growth: {
    earlyUserCount: number;
    remainingEarlySpots: number;
  };
  campaigns: {
    campaignsToScale: number;
    campaignsToImprove: number;
    campaignsToPause: number;
  };
};

export type MarketplaceBrainAction = {
  id: string;
  priority: "low" | "medium" | "high";
  area: "pricing" | "growth" | "trust" | "campaigns" | "conversion";
  title: string;
  description: string;
  recommendedAction: string;
  /** False unless the action is strictly read-only automation (default: false). */
  safeToAutomate: boolean;
};

type RepRow = {
  id: string;
  v: string | null;
  b: string | null;
  r: string | null;
  dlen: string | null;
  has_photo: string | null;
};

function sortByDemand(rows: DemandHeatmapRow[]): DemandHeatmapRow[] {
  return [...rows].sort((a, b) => b.demandScore - a.demandScore);
}

function hotWeakCities(heatmap: DemandHeatmapRow[]): { hot: string[]; weak: string[] } {
  if (heatmap.length === 0) return { hot: [], weak: [] };
  const sorted = sortByDemand(heatmap);
  const n = sorted.length;
  const k = Math.max(1, Math.ceil(n * 0.3));
  const hot = sorted.slice(0, k).map((r) => r.city);
  const weak = sorted.slice(Math.max(0, n - k)).map((r) => r.city);
  return { hot, weak };
}

/** Sample published listings and score reputation in-process (read-only; aligns with listing feed / reputation engine). */
async function loadReputationCounts(): Promise<{ trusted: number; low: number }> {
  const rows = await query<RepRow>(
    `
    SELECT
      l."id"::text AS "id",
      l."bnhub_listing_view_count"::text AS "v",
      l."bnhub_listing_completed_stays"::text AS "b",
      l."bnhub_listing_rating_average"::text AS "r",
      char_length(COALESCE(l."description", ''))::text AS "dlen",
      (CASE
        WHEN l."photos" IS NOT NULL AND l."photos"::text != '[]' AND btrim(l."photos"::text) != 'null' THEN 1
        WHEN EXISTS (SELECT 1 FROM "BnhubListingPhoto" p WHERE p."listingId" = l."id")
        THEN 1
        ELSE 0
      END)::text AS "has_photo"
    FROM "bnhub_listings" l
    WHERE l."listingStatus"::text = 'PUBLISHED'
    ORDER BY l."created_at" DESC
    LIMIT 150
  `
  );
  let trusted = 0;
  let low = 0;
  for (const row of rows) {
    const views = Math.max(0, Math.floor(Number.parseInt(row.v ?? "0", 10) || 0));
    const bookings = Math.max(0, Math.floor(Number.parseInt(row.b ?? "0", 10) || 0));
    const rating = (() => {
      const x = Number.parseFloat(row.r ?? "0");
      return Number.isFinite(x) ? x : 0;
    })();
    const dlen = Math.max(0, Math.floor(Number.parseInt(row.dlen ?? "0", 10) || 0));
    const hasPhoto = (row.has_photo ?? "0") === "1";
    const rep = computeListingReputationFromMetrics({
      listingId: row.id,
      bookings,
      views,
      rating,
      descriptionLength: dlen,
      hasPhoto,
    });
    if (rep.level === "high") trusted += 1;
    if (rep.level === "low") low += 1;
  }
  return { trusted, low };
}

async function computeBrain(): Promise<{ summary: MarketplaceBrainSummary; actions: MarketplaceBrainAction[] }> {
  const [heatmap, cityPricing, listingPricing, early, campaignInsights, repCounts] = await Promise.all([
    getDemandHeatmap(),
    getCityPricingRecommendations(),
    getListingPricingRecommendations(),
    getEarlyUserSignals(),
    getCampaignOptimizationInsightsForMarketplace(),
    loadReputationCounts(),
  ]);

  const { hot: hotCities, weak: weakCities } = hotWeakCities(heatmap);
  const hotSet = new Set(hotCities.map((c) => c.trim().toLowerCase()));

  let increaseCount = 0;
  let decreaseCount = 0;
  for (const c of cityPricing) {
    if (c.recommendation === "increase_price") increaseCount += 1;
    if (c.recommendation === "decrease_price") decreaseCount += 1;
  }
  for (const l of listingPricing) {
    if (l.recommendation === "increase_price") increaseCount += 1;
    if (l.recommendation === "decrease_price") decreaseCount += 1;
  }

  const campaignsToScale = campaignInsights.filter((x) => x.recommendation === "scale_budget").length;
  const campaignsToImprove = campaignInsights.filter((x) => x.recommendation === "improve_copy").length;
  const campaignsToPause = campaignInsights.filter((x) => x.recommendation === "pause_campaign").length;

  const summary: MarketplaceBrainSummary = {
    demand: { hotCities, weakCities },
    pricing: { increaseCount, decreaseCount },
    reputation: {
      trustedListingCount: repCounts.trusted,
      lowTrustListingCount: repCounts.low,
    },
    growth: {
      earlyUserCount: early.count,
      remainingEarlySpots: early.remaining,
    },
    campaigns: {
      campaignsToScale,
      campaignsToImprove,
      campaignsToPause,
    },
  };

  const actions: MarketplaceBrainAction[] = [];

  const hotWithIncrease = cityPricing.filter(
    (c) => c.recommendation === "increase_price" && hotSet.has(c.city.trim().toLowerCase())
  );
  if (hotWithIncrease.length > 0) {
    const cities = hotWithIncrease
      .slice(0, 5)
      .map((c) => c.city)
      .join(", ");
    actions.push({
      id: "mb-pricing-hot-visibility",
      priority: "high",
      area: "pricing",
      title: "Increase visibility and review pricing",
      description: `Demand is elevated in ${hotWithIncrease.length} market(s) that already lean toward price increases; visibility and rate discipline should move together.`,
      recommendedAction: `Review nightly rates and distribution for: ${cities}. Confirm comps before any change — recommendations only.`,
      safeToAutomate: false,
    });
  }

  const weakSet = new Set(weakCities.map((c) => c.trim().toLowerCase()));
  const weakLowBook = heatmap.filter(
    (h) => weakSet.has(h.city.trim().toLowerCase()) && h.bookings < 3
  );
  if (weakLowBook.length > 0) {
    const names = weakLowBook
      .slice(0, 4)
      .map((h) => h.city)
      .join(", ");
    actions.push({
      id: "mb-growth-weak-demand",
      priority: "medium",
      area: "growth",
      title: "Launch demand campaign",
      description: `Weak demand pockets show limited bookings: ${weakLowBook.length} area(s) need more qualified traffic, not just price cuts.`,
      recommendedAction: `Plan targeted acquisition or partnership campaigns for: ${names}. Measure incrementally.`,
      safeToAutomate: false,
    });
  }

  if (repCounts.low >= 5) {
    actions.push({
      id: "mb-trust-listing-quality",
      priority: "high",
      area: "trust",
      title: "Improve verification and listing quality",
      description: `Many listings in the sample skew toward low trust signals (content, traction, or stability). This affects conversion and safety.`,
      recommendedAction:
        "Prioritize host verification, photo and description completeness, and consistent pricing. No public shaming — improve over time.",
      safeToAutomate: false,
    });
  }

  if (campaignsToImprove > 0) {
    actions.push({
      id: "mb-campaigns-ad-copy",
      priority: "medium",
      area: "campaigns",
      title: "Generate new ad copy",
      description: `${campaignsToImprove} simulated campaign(s) suggest copy refresh from performance signals.`,
      recommendedAction: "Draft new copy variants, run in simulation, and compare CTR/conversion before spend changes.",
      safeToAutomate: false,
    });
  }

  const trafficNoBook = listingPricing.filter((l) => l.views >= 40 && l.bookings <= 1);
  if (trafficNoBook.length >= 2) {
    actions.push({
      id: "mb-conversion-booking-cta",
      priority: "medium",
      area: "conversion",
      title: "Show stronger booking CTA",
      description: `${trafficNoBook.length} listings have material traffic but very few completed bookings; guests may be stalling at decision time.`,
      recommendedAction: "Test clearer booking CTAs, trust cues, and checkout friction — measure booking_started vs listing_view.",
      safeToAutomate: false,
    });
  }

  const prioOrder = { high: 0, medium: 1, low: 2 } as const;
  actions.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);

  return { summary, actions };
}

const BRAIN_CACHE_TTL_MS = 5000;
let brainCache: { exp: number; data: { summary: MarketplaceBrainSummary; actions: MarketplaceBrainAction[] } } | null =
  null;

async function getCachedBrainData(): Promise<{
  summary: MarketplaceBrainSummary;
  actions: MarketplaceBrainAction[];
} | null> {
  if (!flags.AUTONOMOUS_AGENT) return null;
  const now = Date.now();
  if (brainCache && now < brainCache.exp) return brainCache.data;
  const data = await computeBrain();
  brainCache = { exp: now + BRAIN_CACHE_TTL_MS, data };
  return data;
}

/**
 * System-wide AI coordinator snapshot (recommendations only, no side effects).
 * Returns `null` when `flags.AUTONOMOUS_AGENT` is off.
 */
export async function getMarketplaceBrainSummary(): Promise<MarketplaceBrainSummary | null> {
  const d = await getCachedBrainData();
  return d?.summary ?? null;
}

/**
 * Prioritized recommended actions (no automation execution).
 * Returns `[]` when `flags.AUTONOMOUS_AGENT` is off.
 */
export async function getMarketplaceBrainActions(): Promise<MarketplaceBrainAction[]> {
  const d = await getCachedBrainData();
  return d?.actions ?? [];
}
