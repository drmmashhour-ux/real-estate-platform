/**
 * Search → click metrics from BNHub client click stream (read-only).
 * Per-listing SERP impression counts are not stored; CTR is only computed when a safe denominator exists.
 */

import { prisma } from "@/lib/db";
import type { BNHubSearchConversionMetrics } from "./guest-conversion.types";

const DEFAULT_WINDOW_DAYS = 30;

/** Click types that indicate a listing was chosen from discovery / search-adjacent UI (mobile + web patterns). */
const DISCOVERY_CLICK_TARGET_TYPES = new Set([
  "listing_card",
  "search_chip",
  "cta_primary",
  "bnhub_nav",
  "map_pin",
]);

export type SearchConversionContext = {
  /** Rolling window in days (default 30). */
  windowDays?: number;
};

export type SearchConversionBuildResult = {
  metrics: BNHubSearchConversionMetrics;
  /** Human-readable notes for parent summary weak signals (e.g. missing impression telemetry). */
  dataNotes: string[];
};

function safeCtr(clicks: number, impressions: number): number | undefined {
  if (impressions <= 0) return undefined;
  return Math.round((10000 * clicks) / impressions) / 100;
}

/**
 * Derives search-adjacent click counts and optional CTR when denominator data exists.
 * Does not write. Safe when tables are empty.
 */
export async function buildSearchConversionMetrics(
  listingId: string,
  context?: SearchConversionContext,
): Promise<SearchConversionBuildResult> {
  const windowDays = Math.min(90, Math.max(7, context?.windowDays ?? DEFAULT_WINDOW_DAYS));
  const since = new Date(Date.now() - windowDays * 86400000);
  const dataNotes: string[] = [];

  let discoveryClicks = 0;
  let searchContextViews = 0;

  try {
    const [clicksRow, viewsRow] = await Promise.all([
      prisma.bnhubClientClickEvent.count({
        where: {
          supabaseListingId: listingId,
          createdAt: { gte: since },
          targetType: { in: [...DISCOVERY_CLICK_TARGET_TYPES] },
        },
      }),
      prisma.bnhubClientListingViewEvent.count({
        where: {
          supabaseListingId: listingId,
          createdAt: { gte: since },
          OR: [
            { source: { contains: "search", mode: "insensitive" } },
            { source: { contains: "stays", mode: "insensitive" } },
            { source: { contains: "map", mode: "insensitive" } },
            { source: { contains: "results", mode: "insensitive" } },
          ],
        },
      }),
    ]);
    discoveryClicks = clicksRow;
    searchContextViews = viewsRow;
  } catch {
    dataNotes.push("Search click/view aggregates were unavailable for this window.");
    return {
      metrics: { clicks: undefined, impressions: undefined, clickThroughRate: undefined },
      dataNotes,
    };
  }

  const metrics: BNHubSearchConversionMetrics = {
    clicks: discoveryClicks,
  };

  /** True SERP impressions per listing are not persisted; we never invent them. */
  dataNotes.push(
    "Per-listing search impression counts are not stored in v1; CTR uses discovery-context listing views only when present.",
  );

  if (searchContextViews > 0) {
    metrics.impressions = searchContextViews;
    metrics.clickThroughRate = safeCtr(discoveryClicks, searchContextViews);
  } else {
    metrics.impressions = undefined;
    metrics.clickThroughRate = undefined;
    dataNotes.push(
      "No listing views tagged with search/map/results sources in the window — CTR from search context unavailable.",
    );
  }

  return { metrics, dataNotes };
}
