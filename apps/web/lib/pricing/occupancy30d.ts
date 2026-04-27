import "server-only";

import { getListingsDB } from "@/lib/db/routeSwitch";
import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { activeMarketplaceInventoryFilter, whereBookingListOverlapsWindow } from "@/lib/marketplace/booking-hold";
import { eachYmdInclusive, ymdIsBookedByRanges } from "@/lib/booking/dailyCalendarQuery";

/**
 * 30-day forward window from `anchorYmd` (inclusive of anchor): share of [anchor, anchor+29] that is booked (0–1).
 * Order 61 — one proxy for “listing occupancy” in dynamic daily pricing.
 */
export async function getListingOccupancy30dRatio(listingId: string, anchorYmd: string): Promise<number> {
  const id = listingId?.trim();
  if (!id) return 0;
  const from = toDateOnlyFromString(anchorYmd.slice(0, 10));
  if (Number.isNaN(from.getTime())) return 0;
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 29);
  const endYmd = to.toISOString().slice(0, 10);
  const startYmd = anchorYmd.slice(0, 10);

  const db = getListingsDB();
  const bookings = await db.booking.findMany({
    where: {
      listingId: id,
      ...activeMarketplaceInventoryFilter(),
      ...whereBookingListOverlapsWindow(from, to),
    },
    select: { startDate: true, endDate: true },
  });

  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const rangeRows = bookings.map((b) => ({ startYmd: ymd(b.startDate), endYmd: ymd(b.endDate) }));
  const dayKeys = eachYmdInclusive(startYmd, endYmd);
  if (dayKeys.length === 0) return 0;
  const bookedNights = dayKeys.filter((dkey) => ymdIsBookedByRanges(dkey, rangeRows)).length;
  return bookedNights / dayKeys.length;
}
