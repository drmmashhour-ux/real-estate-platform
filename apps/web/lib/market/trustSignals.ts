import "server-only";

import { CACHE_KEYS, getCached } from "@/lib/cache";
import { getDemandHeatmap, type DemandHeatmapRow } from "@/lib/market/demandHeatmap";
import { query } from "@/lib/sql";

export type TrustSignals = {
  demandMessage: string;
  scarcityMessage: string | null;
  viewsToday: number;
  listingCount: number;
  /**
   * From heatmap demand score: hero + dynamic copy. `unknown` when no city.
   * @see getHeroHeadline in lib/landing/heroCopy
   */
  demandLevel: "high" | "medium" | "low" | "unknown";
};

const TRUST_TTL_SEC = 30;

function findHeatmapRow(
  rows: DemandHeatmapRow[],
  city: string
): DemandHeatmapRow | undefined {
  const t = city.trim();
  if (!t) return undefined;
  return rows.find(
    (r) => r.city.trim().length > 0 && r.city.localeCompare(t, undefined, { sensitivity: "base" }) === 0
  );
}

function demandMessageForDisplayCity(displayCity: string, demandScore: number) {
  if (demandScore >= 100) {
    return `High demand in ${displayCity} right now`;
  }
  if (demandScore >= 50) {
    return `Demand increasing in ${displayCity}`;
  }
  return `Stable market activity in ${displayCity}`;
}

function demandLevelFromScore(demandScore: number): "high" | "medium" | "low" {
  if (demandScore >= 100) return "high";
  if (demandScore >= 50) return "medium";
  return "low";
}

function scarcityForCount(count: number): string | null {
  if (count < 5) return "Very limited availability";
  if (count < 10) return "Limited availability";
  return null;
}

async function countListingsInCity(city: string): Promise<number> {
  const rows = await query<{ c: string }>(
    `
    SELECT COUNT(*)::text AS c
    FROM "bnhub_listings" l
    WHERE l."listing_status" = 'PUBLISHED'
      AND l."city" IS NOT NULL
      AND btrim(l."city") != ''
      AND lower(trim(l."city")) = lower(trim($1::text))
  `,
    [city]
  );
  return Math.max(0, Math.floor(Number.parseFloat(rows[0]?.c ?? "0")));
}

async function countListingsAll(): Promise<number> {
  const rows = await query<{ c: string }>(`
    SELECT COUNT(*)::text AS c
    FROM "bnhub_listings" l
    WHERE l."listing_status" = 'PUBLISHED'
  `);
  return Math.max(0, Math.floor(Number.parseFloat(rows[0]?.c ?? "0")));
}

async function countListingViews24h(): Promise<number> {
  const rows = await query<{ c: string }>(`
    SELECT COUNT(*)::text AS c
    FROM "marketplace_events" e
    WHERE e."event" = 'listing_view'
      AND (e."data" ? 'listingId')
      AND e."created_at" >= NOW() - INTERVAL '24 hours'
  `);
  return Math.max(0, Math.floor(Number.parseFloat(rows[0]?.c ?? "0")));
}

async function loadTrustSignals(city: string | undefined): Promise<TrustSignals> {
  const [heatmap, viewsToday, totalPublished] = await Promise.all([
    getDemandHeatmap(),
    countListingViews24h(),
    countListingsAll(),
  ]);

  if (!city || !city.trim()) {
    return {
      demandMessage: "",
      scarcityMessage: null,
      viewsToday,
      listingCount: totalPublished,
      demandLevel: "unknown",
    };
  }

  const row = findHeatmapRow(heatmap, city);
  const displayCity = row?.city?.trim() || city.trim();
  const demandScore = row?.demandScore ?? 0;
  const demandMessage = demandMessageForDisplayCity(displayCity, demandScore);

  let listingCount = row != null ? Math.max(0, row.listingCount) : 0;
  if (listingCount === 0) {
    listingCount = await countListingsInCity(city);
  }

  const scarcityMessage = scarcityForCount(listingCount);

  return {
    demandMessage,
    scarcityMessage,
    viewsToday,
    listingCount,
    demandLevel: demandLevelFromScore(demandScore),
  };
}

/**
 * City-level demand, scarcity, and global view activity for trust/conversion blocks.
 * In-memory TTL cache (Order 73.2); safe aggregated marketing data only.
 */
export function getTrustSignals(city: string | undefined): Promise<TrustSignals> {
  const key = (city ?? "").trim().toLowerCase() || "_all";
  return getCached(CACHE_KEYS.trustSignals(key), TRUST_TTL_SEC, () => loadTrustSignals(city));
}
