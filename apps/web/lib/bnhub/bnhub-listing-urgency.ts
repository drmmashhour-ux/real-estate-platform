import { SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";

/** Start of current UTC calendar day — consistent for “today” view counts. */
function startOfUtcDay(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * VIEW events for this listing since UTC midnight (includes the current page view if tracked first).
 */
export async function countBnhubListingViewsToday(listingId: string): Promise<number> {
  return prisma.searchEvent.count({
    where: {
      listingId,
      eventType: SearchEventType.VIEW,
      createdAt: { gte: startOfUtcDay() },
    },
  });
}

export function bnhubLimitedAvailabilityFromInsight(insight: BnhubMarketInsightPayload | null): boolean {
  if (!insight) return false;
  if (insight.demandLevel === "high") return true;
  if (insight.demandLevel === "medium" && insight.peerBookingsLast30dInCity >= 25) return true;
  if (insight.listingBookingsLast30d >= 2) return true;
  return false;
}
