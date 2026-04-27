import "server-only";

import { flags } from "@/lib/flags";
import { query } from "@/lib/sql";

import {
  computeListingReputationFromMetrics,
  type ListingReputation,
  type ListingReputationMetrics,
  type ReputationLevel,
  reputationLevelFromScore,
} from "./reputationScoringCore";

export type { ListingReputation, ListingReputationMetrics, ReputationLevel } from "./reputationScoringCore";
export { computeListingReputationFromMetrics } from "./reputationScoringCore";

export type HostReputation = {
  hostUserId: string;
  score: number;
  level: ReputationLevel;
  signals: string[];
};

type ListingRow = {
  id: string;
  v: string | null;
  b: string | null;
  r: string | null;
  dlen: string | null;
  has_photo: string | null;
};

/**
 * One listing: uses denormalized BNHub view/stay counts + content signals (read-only, Order 48).
 */
export async function getListingReputation(listingId: string): Promise<ListingReputation> {
  if (!flags.RECOMMENDATIONS) {
    return { listingId, score: 0, level: "low", signals: [] };
  }
  const rows = await query<ListingRow>(
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
    WHERE l."id"::text = $1
    LIMIT 1
  `,
    [listingId]
  );
  const row = rows[0];
  if (!row) {
    return { listingId, score: 0.2, level: "medium", signals: ["no_row_fallback"] };
  }
  const views = Math.max(0, Math.floor(Number.parseInt(row.v ?? "0", 10) || 0));
  const bookings = Math.max(0, Math.floor(Number.parseInt(row.b ?? "0", 10) || 0));
  const rating = (() => {
    const x = Number.parseFloat(row.r ?? "0");
    return Number.isFinite(x) ? x : 0;
  })();
  const dlen = Math.max(0, Math.floor(Number.parseInt(row.dlen ?? "0", 10) || 0));
  const hasPhoto = (row.has_photo ?? "0") === "1";

  return computeListingReputationFromMetrics({
    listingId,
    bookings,
    views,
    rating,
    descriptionLength: dlen,
    hasPhoto,
  });
}

function hostReputationFromStats(hostUserId: string, listingCount: number, totalStays: number): HostReputation {
  let acc = 0.25;
  const signals: string[] = ["host_baseline"];
  if (listingCount >= 1) {
    acc += 0.1;
    signals.push("active_host");
  }
  if (listingCount >= 3) {
    acc += 0.12;
    signals.push("multi_listing");
  }
  if (totalStays >= 5) {
    acc += 0.2;
    signals.push("repeat_bookings");
  }
  if (totalStays >= 25) {
    acc += 0.2;
    signals.push("established_traction");
  }
  const score = Math.min(1, acc);
  return { hostUserId, score, level: reputationLevelFromScore(score), signals };
}

/**
 * Host-level aggregate: published listings + completed stays (additive, bounded).
 */
export async function getHostReputation(hostUserId: string): Promise<HostReputation> {
  if (!flags.RECOMMENDATIONS) {
    return { hostUserId, score: 0, level: "low", signals: [] };
  }
  const map = await getHostReputationsForHostIds([hostUserId]);
  return map.get(hostUserId) ?? { hostUserId, score: 0.25, level: "low", signals: ["host_baseline"] };
}

type HostAgg = { hostId: string; c: string | null; s: string | null };

/** One query for many hosts (feed, dashboards). */
export async function getHostReputationsForHostIds(
  hostIds: string[]
): Promise<Map<string, HostReputation>> {
  const m = new Map<string, HostReputation>();
  if (!flags.RECOMMENDATIONS) {
    return m;
  }
  const unique = [...new Set(hostIds.filter((x) => x?.trim()))];
  for (const id of unique) {
    m.set(id, { hostUserId: id, score: 0.25, level: "low", signals: ["host_baseline"] });
  }
  if (unique.length === 0) return m;

  const rows = await query<HostAgg>(
    `
    SELECT
      l."host_id"::text AS "hostId",
      COUNT(*)::text AS "c",
      COALESCE(SUM(l."bnhub_listing_completed_stays"), 0)::text AS "s"
    FROM "bnhub_listings" l
    WHERE l."host_id" = ANY($1::text[])
      AND l."listingStatus"::text = 'PUBLISHED'
    GROUP BY 1
  `,
    [unique]
  );
  for (const row of rows) {
    const listingCount = Math.max(0, Math.floor(Number.parseInt(row.c ?? "0", 10) || 0));
    const totalStays = Math.max(0, Math.floor(Number.parseInt(row.s ?? "0", 10) || 0));
    m.set(row.hostId, hostReputationFromStats(row.hostId, listingCount, totalStays));
  }
  return m;
}
