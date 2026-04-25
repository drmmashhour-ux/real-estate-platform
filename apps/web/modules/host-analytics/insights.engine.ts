/**
 * Rule-based host insights from measured BNHub metrics only (no fabricated benchmarks).
 */

import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import type { HostRevenueInsight, HostRevenueMetrics } from "./host-analytics.types";
import type { WeekendWeekdayAdr } from "./metrics.service";
import { buildHostRevenueMetrics, computeWeekendWeekdayAdr } from "./metrics.service";

export type BuildHostRevenueInsightsParams = {
  hostUserId: string;
  rangeStart: Date;
  rangeEnd: Date;
  listingId?: string | null;
};

/** Pure insight rules — use when `current` / `prior` metrics are already loaded. */
export function buildHostRevenueInsightsFromMetrics(
  current: HostRevenueMetrics,
  prior: HostRevenueMetrics,
  adrSplit: WeekendWeekdayAdr | null,
): HostRevenueInsight[] {
  const out: HostRevenueInsight[] = [];

  if (
    current.occupancyRate != null &&
    prior.occupancyRate != null &&
    prior.occupancyRate > 0.05 &&
    current.occupancyRate < prior.occupancyRate * 0.85
  ) {
    out.push({
      id: "occupancy_vs_prior",
      severity: "watch",
      title: "Occupancy is below your prior period",
      detail: `This window’s occupancy is about ${(current.occupancyRate * 100).toFixed(1)}%, down from roughly ${(prior.occupancyRate * 100).toFixed(1)}% in the previous period of the same length (from real booked nights vs available nights).`,
      basis: `currentOccupancy=${current.occupancyRate.toFixed(4)} priorOccupancy=${prior.occupancyRate.toFixed(4)}`,
    });
  }

  if (
    adrSplit &&
    adrSplit.weekdayNights >= 3 &&
    adrSplit.weekendNights >= 3 &&
    adrSplit.weekdayAdrCents != null &&
    adrSplit.weekendAdrCents != null &&
    adrSplit.weekendAdrCents < adrSplit.weekdayAdrCents * 1.02
  ) {
    out.push({
      id: "weekend_adr_gap",
      severity: "opportunity",
      title: "Weekend nightly rates trail weekdays",
      detail:
        "Blended host revenue per night is lower on weekend nights than on weekdays in this period. If demand is strong, consider testing higher weekend prices; if not, keep rates steady.",
      basis: `weekendAdrCents=${adrSplit.weekendAdrCents} weekdayAdrCents=${adrSplit.weekdayAdrCents} weekendNights=${adrSplit.weekendNights} weekdayNights=${adrSplit.weekdayNights}`,
    });
  }

  if (current.bookingConversionRate != null && current.bookingConversionRate < 0.15 && current.listingCount > 0) {
    out.push({
      id: "inquiry_conversion_low",
      severity: "info",
      title: "Few bookings relative to inquiries",
      detail:
        "A low inquiry-to-booking ratio can be normal if guests book instantly without messaging. Ensure listing photos, pricing, and instant-book settings match guest expectations.",
      basis: `bookingConversionRate=${current.bookingConversionRate.toFixed(4)}`,
    });
  }

  if (current.cancellationRate != null && current.cancellationRate > 0.2) {
    out.push({
      id: "cancellations_elevated",
      severity: "watch",
      title: "Elevated cancellations in this period",
      detail:
        "Cancellations are a meaningful share of completed stays in the window. Review calendar settings, house rules, and pre-stay messaging for clarity.",
      basis: `cancellationRate=${current.cancellationRate.toFixed(4)}`,
    });
  }

  return out;
}

/**
 * Loads current + prior metrics and weekend/weekday ADR, then applies {@link buildHostRevenueInsightsFromMetrics}.
 */
export async function buildHostRevenueInsights(
  params: BuildHostRevenueInsightsParams,
): Promise<HostRevenueInsight[]> {
  const { hostUserId, rangeStart, rangeEnd, listingId } = params;
  const start = utcDayStart(rangeStart);
  const end = utcDayStart(rangeEnd);
  const spanMs = end.getTime() - start.getTime();
  if (spanMs <= 0) return [];

  const [current, prior] = await Promise.all([
    buildHostRevenueMetrics({ hostUserId, rangeStart: start, rangeEnd: end, listingId }),
    buildHostRevenueMetrics({
      hostUserId,
      rangeStart: new Date(start.getTime() - spanMs),
      rangeEnd: start,
      listingId,
    }),
  ]);

  const listingIds =
    listingId != null ? [listingId] : current.listingBreakdown.map((r) => r.listingId);

  const adrSplit =
    listingIds.length > 0
      ? await computeWeekendWeekdayAdr({ listingIds, rangeStart: start, rangeEnd: end })
      : null;

  return buildHostRevenueInsightsFromMetrics(current, prior, adrSplit);
}
