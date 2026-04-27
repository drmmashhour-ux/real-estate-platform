import "server-only";

import { getListingAvailability } from "@/lib/booking/availability";
import { flags } from "@/lib/flags";
import type { DemandHeatmapRow } from "@/lib/market/demandHeatmap";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { getListingPricingSignalForId } from "@/lib/market/listingPricingEngine";
import { query } from "@/lib/sql";

import { convertSignalsToScore, emptyConversionScore } from "./conversionScoringCore";
import type { ConversionSignals } from "./conversionScoringCore";
import { getListingReputation } from "./reputationEngine";
import { generateSocialProof } from "./socialProof";
import type { ConversionIntentLevel, ConversionScore } from "./conversionTypes";

export type { ConversionIntentLevel, ConversionNudge, ConversionScore } from "./conversionTypes";
export type { ConversionSignals } from "./conversionScoringCore";
export {
  convertSignalsToScore,
  emptyConversionScore,
  getConversionNudge,
  canUseAttentionWording,
} from "./conversionScoringCore";

export type ConversionInput = {
  listingId: string;
  userId?: string;
  /** Target listing city (for same-city and demand; omit to load from DB). */
  city?: string;
};

async function loadCity(city: string | undefined, listingId: string): Promise<string> {
  if (city && city.trim()) return city.trim();
  const rows = await query<{ c: string | null }>(
    `SELECT l."city" AS c FROM "bnhub_listings" l WHERE l."id" = $1 LIMIT 1`,
    [listingId]
  );
  return (rows[0]?.c ?? "").trim() || "—";
}

async function loadSignalsFromDb(
  input: ConversionInput,
  opts?: { heatmap?: DemandHeatmapRow[] }
): Promise<ConversionSignals> {
  const { listingId, userId } = input;
  if (!userId) {
    return {
      viewsThisListing: 0,
      viewsInSameCity: 0,
      hasFeedClick: false,
      hasSearchActivity: false,
      hasSavedListing: false,
      hasBookingStarted: false,
      demandScoreForCity: 0,
      priceIncreaseRecommended: false,
    };
  }

  const city = await loadCity(input.city, listingId);

  const [viewsRow, sameCityRow, userEvtRow, activityRow, heat, priceRec, listingSocialRow, listingRep, listingOcc] =
    await Promise.all([
    query<{ c: string | null }>(
      `
      SELECT COUNT(*)::text AS c
      FROM "marketplace_events" e
      WHERE e."event" = 'listing_view'
        AND (e."data"->>'listingId') = $1
        AND (e."data"->>'userId') = $2
    `,
      [listingId, userId]
    ),
    query<{ c: string | null }>(
      `
      SELECT COUNT(*)::text AS c
      FROM "marketplace_events" e
      INNER JOIN "bnhub_listings" l
        ON l."id"::text = (e."data"->>'listingId')
        AND l."listingStatus"::text = 'PUBLISHED'
      WHERE e."event" = 'listing_view'
        AND (e."data"->>'userId') = $1
        AND l."city" = $2
        AND (e."data"->>'listingId') IS NOT NULL
        AND (e."data"->>'listingId') <> $3
    `,
      [userId, city, listingId]
    ),
    query<{
      feed: string | null;
      book: string | null;
      search: string | null;
    }>(
      `
      SELECT
        COUNT(*) FILTER (WHERE
          (u."event_type"::text = 'VISIT_PAGE' AND (u."metadata"->>'rawEventType') = 'feed_click' AND (u."metadata"->>'listingId') = $2)
        )::text AS "feed",
        COUNT(*) FILTER (WHERE
          u."event_type"::text = 'BOOKING_START'
          AND (u."metadata"->>'listingId' = $2 OR u."metadata"->'listing'->>'id' = $2)
        )::text AS "book",
        COUNT(*) FILTER (WHERE
          u."event_type"::text = 'SEARCH_PERFORMED'
        )::text AS "search"
      FROM "user_events" u
      WHERE u."user_id" = $1
        AND (u."created_at" > NOW() - INTERVAL '90 days')
    `,
      [userId, listingId]
    ),
    query<{ c: string | null }>(
      `
      SELECT COUNT(*)::text AS c
      FROM "ai_user_activity_logs" a
      WHERE a."user_id" = $1
        AND a."event_type" = 'listing_save'
        AND a."listing_id" = $2
    `,
      [userId, listingId]
    ),
    opts?.heatmap != null
      ? Promise.resolve(opts.heatmap)
      : getDemandHeatmap().catch(() => [] as DemandHeatmapRow[]),
    getListingPricingSignalForId(listingId).catch(() => null),
    query<{
      v: string | null;
      b: string | null;
      r: string | null;
    }>(
      `
      SELECT
        l."bnhub_listing_view_count"::text AS "v",
        l."bnhub_listing_completed_stays"::text AS "b",
        l."bnhub_listing_rating_average"::text AS "r"
      FROM "bnhub_listings" l
      WHERE l."id"::text = $1
      LIMIT 1
    `,
      [listingId]
    ),
    getListingReputation(listingId).catch((): null => null),
    getListingAvailability(listingId).catch(() => null),
  ]);

  const viewsThisListing = Math.max(0, Math.floor(Number.parseInt(viewsRow[0]?.c ?? "0", 10) || 0));
  const viewsInSameCity = Math.max(0, Math.floor(Number.parseInt(sameCityRow[0]?.c ?? "0", 10) || 0));
  const hasFeedClick = (Number.parseInt(userEvtRow[0]?.feed ?? "0", 10) || 0) > 0;
  const hasBookingStarted = (Number.parseInt(userEvtRow[0]?.book ?? "0", 10) || 0) > 0;
  const hasSearchActivity = (Number.parseInt(userEvtRow[0]?.search ?? "0", 10) || 0) > 0;
  const hasSavedListing = (Number.parseInt(activityRow[0]?.c ?? "0", 10) || 0) > 0;

  const key = city.trim().toLowerCase();
  const row = Array.isArray(heat) ? heat.find((h) => h.city.trim().toLowerCase() === key) : undefined;
  const demandScoreForCity = row?.demandScore ?? 0;

  const ls = listingSocialRow[0];
  const sp = generateSocialProof({
    views: Math.max(0, Math.floor(Number.parseInt(ls?.v ?? "0", 10) || 0)),
    bookings: Math.max(0, Math.floor(Number.parseInt(ls?.b ?? "0", 10) || 0)),
    rating: (() => {
      const x = Number.parseFloat(ls?.r ?? "0");
      return Number.isFinite(x) ? x : 0;
    })(),
  });

  return {
    viewsThisListing,
    viewsInSameCity,
    hasFeedClick,
    hasSearchActivity,
    hasSavedListing,
    hasBookingStarted,
    demandScoreForCity,
    priceIncreaseRecommended: priceRec === "increase_price",
    socialProofStrength: sp.strength,
    reputationLevel: listingRep?.level,
    listingOccupancyRate: listingOcc?.occupancyRate,
  };
}

/**
 * End-to-end conversion score for a user + listing (used by API and listing page).
 * When `flags.RECOMMENDATIONS` is false, returns a low baseline and does not consult heavy signals.
 */
export async function getConversionScore(input: ConversionInput): Promise<ConversionScore> {
  if (!flags.RECOMMENDATIONS) {
    return emptyConversionScore(input.listingId, input.userId);
  }
  if (!input.userId) {
    return emptyConversionScore(input.listingId, input.userId);
  }
  const sig = await loadSignalsFromDb(input, undefined);
  return convertSignalsToScore(input.listingId, input.userId, sig);
}

/**
 * Fast batch intent (feed badges): same rules as getConversionScore, reuses one heatmap fetch via Promise.all per batch.
 */
export async function getConversionIntentByListingId(
  userId: string | null | undefined,
  listingIds: string[],
  cityByListingId: Record<string, string>
): Promise<Record<string, ConversionIntentLevel>> {
  if (!flags.RECOMMENDATIONS || !userId || listingIds.length === 0) {
    return Object.fromEntries(listingIds.map((id) => [id, "low" as const]));
  }
  const heat = await getDemandHeatmap().catch(() => [] as DemandHeatmapRow[]);
  const out: Record<string, ConversionIntentLevel> = {};
  for (const listingId of listingIds) {
    const city = cityByListingId[listingId] ?? "—";
    const sig = await loadSignalsFromDb({ listingId, userId, city }, { heatmap: heat });
    const sc = convertSignalsToScore(listingId, userId, sig);
    out[listingId] = sc.intentLevel;
  }
  return out;
}
