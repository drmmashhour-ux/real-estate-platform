/**
 * Listing page → booking funnel metrics (read-only Prisma reads).
 */

import { BnhubBookingFunnelStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BNHubListingConversionMetrics } from "./guest-conversion.types";

const DEFAULT_WINDOW_DAYS = 30;

export type ListingConversionBuildResult = {
  metrics: BNHubListingConversionMetrics;
  dataNotes: string[];
};

function rate(num: number, den: number): number | undefined {
  if (den <= 0 || num < 0) return undefined;
  return Math.round((10000 * num) / den) / 100;
}

export async function buildListingConversionMetrics(
  listingId: string,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<ListingConversionBuildResult> {
  const wd = Math.min(90, Math.max(7, windowDays));
  const since = new Date(Date.now() - wd * 86400000);
  const dataNotes: string[] = [];

  let views = 0;
  let starts = 0;
  let paid = 0;

  try {
    const [v, s, p] = await Promise.all([
      prisma.bnhubClientListingViewEvent.count({
        where: { supabaseListingId: listingId, createdAt: { gte: since } },
      }),
      prisma.bnhubClientBookingFunnelEvent.count({
        where: {
          supabaseListingId: listingId,
          stage: BnhubBookingFunnelStage.STARTED,
          createdAt: { gte: since },
        },
      }),
      prisma.bnhubClientBookingFunnelEvent.count({
        where: {
          supabaseListingId: listingId,
          stage: BnhubBookingFunnelStage.PAID,
          createdAt: { gte: since },
        },
      }),
    ]);
    views = v;
    starts = s;
    paid = p;
  } catch {
    dataNotes.push("Listing view / booking funnel aggregates were unavailable.");
    return {
      metrics: {
        listingViews: undefined,
        bookingStarts: undefined,
        bookingCompletions: undefined,
        viewToStartRate: undefined,
        startToBookingRate: undefined,
      },
      dataNotes,
    };
  }

  if (views === 0 && starts === 0 && paid === 0) {
    dataNotes.push("No BNHub client view or funnel events in this window — metrics may be sparse (e.g. web-only traffic).");
  }

  const metrics: BNHubListingConversionMetrics = {
    listingViews: views,
    bookingStarts: starts,
    bookingCompletions: paid,
    viewToStartRate: rate(starts, views),
    startToBookingRate: rate(paid, starts),
  };

  return { metrics, dataNotes };
}
