import "server-only";

import { getListingsDB } from "@/lib/db/routeSwitch";
import { flags } from "@/lib/flags";
import { getSoftPricingBiasForCity } from "@/lib/market/demandActions";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";
import { computeDailyListingPricing } from "@/lib/market/seasonalPricingMath";
import { activeMarketplaceInventoryFilter, whereBookingListOverlapsWindow } from "@/lib/marketplace/booking-hold";
import { toDateOnlyFromString } from "@/lib/dates/dateOnly";

import { eachYmdInclusive, ymdIsBookedByRanges, type ListingDailyCalendarDay } from "@/lib/booking/dailyCalendarQuery";

export type { ListingDailyCalendarDay };

/**
 * Order A.2: one row per day with availability from marketplace `bookings` (batched query) and
 * **pricing** from the same rules as `getSeasonalPricingRecommendations` / {@link computeDailyListingPricing}
 * in `lib/market/seasonalPricingMath` (weekend, season, demand %; clamp) plus `getDemandHeatmap` (30s in-memory cache).
 * Batched: one listing read, one heatmap, one `booking.findMany` for the range — no per-day SQL.
 */
export async function getListingDailyCalendar(
  listingId: string,
  startYmd: string,
  endYmd: string
): Promise<ListingDailyCalendarDay[]> {
  const id = listingId?.trim();
  if (!id) {
    return [];
  }

  const from = toDateOnlyFromString(startYmd);
  const to = toDateOnlyFromString(endYmd);
  if (from.getTime() > to.getTime()) {
    return [];
  }

  const db = getListingsDB();
  const [listing, heatmap, bookings] = await Promise.all([
    db.listing.findUnique({ where: { id }, select: { id: true, price: true, city: true } }),
    getDemandHeatmap(),
    db.booking.findMany({
      where: {
        listingId: id,
        ...activeMarketplaceInventoryFilter(),
        ...whereBookingListOverlapsWindow(from, to),
      },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  if (!listing) {
    return [];
  }

  const byCity = new Map<string, number>();
  for (const row of heatmap) {
    byCity.set(row.city.trim().toLowerCase(), row.demandScore);
  }
  const cityKey = listing.city?.trim().toLowerCase() ?? null;
  const cityDemand = cityKey ? (byCity.get(cityKey) ?? 0) : 0;
  const demandActionSoftBiasPercent = getSoftPricingBiasForCity(heatmap, listing.city ?? null);

  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const rangeRows = bookings.map((b) => ({
    startYmd: ymd(b.startDate),
    endYmd: ymd(b.endDate),
  }));

  const dayKeys = eachYmdInclusive(startYmd, endYmd);
  const base = listing.price;

  const baseForRow = Number.isFinite(base) ? base : null;
  let occupancyForRange: number | null = null;
  if (flags.REVENUE_OPTIMIZATION_LAYER && dayKeys.length > 0) {
    const bookedNights = dayKeys.filter((dkey) => ymdIsBookedByRanges(dkey, rangeRows)).length;
    occupancyForRange = bookedNights / dayKeys.length;
  }

  return dayKeys.map((dkey) => {
    const booked = ymdIsBookedByRanges(dkey, rangeRows);
    const available = !booked;
    const rec = computeDailyListingPricing({
      basePrice: typeof baseForRow === "number" ? baseForRow : 0,
      dateYmd: dkey,
      city: listing.city ?? null,
      cityDemandScore: cityDemand,
      demandActionSoftBiasPercent,
      occupancyRatio: occupancyForRange,
    });
    return {
      date: dkey,
      available,
      booked,
      basePrice: baseForRow,
      /** Opaque when booked — UI should not lead with a dollar amount on a blocked night. */
      suggestedPrice: booked ? null : rec.suggestedPrice,
      adjustmentPercent: rec.adjustmentPercent,
      demandLevel: rec.demandLevel,
      reason: rec.reason,
    };
  });
}
