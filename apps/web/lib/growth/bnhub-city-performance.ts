import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const SUCCESS_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];
import {
  DOMINATION_CITIES,
  DOMINATION_CITY_ORDER,
  type DominationCityKey,
} from "@/lib/growth/domination-cities";

function rangeStart(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(1, Math.min(365, days)));
  return d;
}

export type CityPerformanceRow = {
  key: DominationCityKey;
  displayName: string;
  publishedListings: number;
  bookingsInPeriod: number;
  gmvCentsInPeriod: number;
};

/** Per domination market: supply + demand (bookings tied to listings in that geo filter). */
export async function getDominationCityPerformance(days = 30): Promise<CityPerformanceRow[]> {
  const start = rangeStart(days);
  const bookingBase = {
    createdAt: { gte: start },
    status: { in: SUCCESS_STATUSES },
  };

  const out: CityPerformanceRow[] = [];

  for (const key of DOMINATION_CITY_ORDER) {
    const cfg = DOMINATION_CITIES[key];
    const listingFilter = cfg.listingWhere;

    const listingBookingWhere = {
      ...bookingBase,
      listing: { is: listingFilter },
    };

    const [publishedListings, bookingsInPeriod, sumRow] = await Promise.all([
      prisma.shortTermListing.count({ where: listingFilter }),
      prisma.booking.count({ where: listingBookingWhere }),
      prisma.booking.aggregate({
        where: listingBookingWhere,
        _sum: { totalCents: true },
      }),
    ]);

    out.push({
      key,
      displayName: cfg.displayName,
      publishedListings,
      bookingsInPeriod,
      gmvCentsInPeriod: sumRow._sum?.totalCents ?? 0,
    });
  }

  return out;
}
