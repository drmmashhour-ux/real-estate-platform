/**
 * BNHub host revenue & occupancy analytics from Prisma bookings only (no projections).
 */

import { BookingStatus, ListingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import type {
  HostAnalyticsTimePoint,
  HostListingAnalyticsRow,
  HostRevenueBreakdownCents,
  HostRevenueMetrics,
} from "./host-analytics.types";

const REVENUE_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const CANCELLED_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.CANCELLED,
];

function daysBetweenUtc(start: Date, end: Date): number {
  const a = utcDayStart(start).getTime();
  const b = utcDayStart(end).getTime();
  if (b <= a) return 0;
  return Math.ceil((b - a) / 86400000);
}

function isoMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekendNight(d: Date): boolean {
  const wd = d.getUTCDay(); // 0 Sun .. 6 Sat
  return wd === 0 || wd === 5 || wd === 6;
}

export function hostRevenueCentsForBooking(b: {
  totalCents: number;
  hostFeeCents: number;
  payment: { status: string; hostPayoutCents: number | null } | null;
  bnhubInvoice: { hostPayoutCents: number | null } | null;
}): number {
  if (b.payment?.status === "COMPLETED" && b.payment.hostPayoutCents != null) {
    return Math.max(0, b.payment.hostPayoutCents);
  }
  if (b.bnhubInvoice?.hostPayoutCents != null) {
    return Math.max(0, b.bnhubInvoice.hostPayoutCents);
  }
  return Math.max(0, b.totalCents - (b.hostFeeCents ?? 0));
}

function overlapNights(checkIn: Date, checkOut: Date, rangeStart: Date, rangeEnd: Date): Date[] {
  const stayNights = eachNightBetween(checkIn, checkOut);
  return stayNights.filter((n) => n >= rangeStart && n < rangeEnd);
}

function accumulateBreakdownFraction(
  booking: {
    totalCents: number;
    guestFeeCents: number;
    listing: { cleaningFeeCents: number };
  },
  fraction: number,
  target: HostRevenueBreakdownCents,
): void {
  const f = Math.max(0, Math.min(1, fraction));
  if (f === 0) return;
  const cleaning = Math.min(Math.max(0, booking.listing.cleaningFeeCents), Math.max(0, booking.totalCents));
  const nightly = Math.max(0, booking.totalCents - cleaning);
  target.baseNightlyCents += Math.round(nightly * f);
  target.cleaningCents += Math.round(cleaning * f);
  target.guestServiceFeeCents += Math.round(Math.max(0, booking.guestFeeCents) * f);
}

export type BuildHostRevenueMetricsOptions = {
  hostUserId: string;
  /** UTC start (inclusive) for analytics window. */
  rangeStart: Date;
  /** UTC end (exclusive) — typically start of "today" or tomorrow. */
  rangeEnd: Date;
  listingId?: string | null;
};

/**
 * Builds host analytics for BNHub listings owned by `hostUserId`.
 * Revenue and occupancy use only overlapping stays in `[rangeStart, rangeEnd)`.
 */
export async function buildHostRevenueMetrics(
  opts: BuildHostRevenueMetricsOptions,
): Promise<HostRevenueMetrics> {
  const { hostUserId, rangeStart, rangeEnd, listingId } = opts;
  const start = utcDayStart(rangeStart);
  const end = utcDayStart(rangeEnd);
  const days = daysBetweenUtc(start, end);

  const listings = await prisma.shortTermListing.findMany({
    where: {
      ownerId: hostUserId,
      ...(listingId ? { id: listingId } : {}),
    },
    select: {
      id: true,
      title: true,
      listingCode: true,
      cleaningFeeCents: true,
      createdAt: true,
      listingStatus: true,
      nightPriceCents: true,
    },
  });

  const listingIds = listings.map((l) => l.id);
  const listingById = new Map(listings.map((l) => [l.id, l]));

  if (listingIds.length === 0) {
    return emptyMetrics(start, end, days, listingId != null ? 0 : 0);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: listingIds },
      status: { in: [...REVENUE_STATUSES, ...CANCELLED_STATUSES, BookingStatus.DECLINED, BookingStatus.EXPIRED] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: {
      id: true,
      listingId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      totalCents: true,
      guestFeeCents: true,
      hostFeeCents: true,
      status: true,
      createdAt: true,
      canceledAt: true,
      payment: { select: { status: true, hostPayoutCents: true } },
      bnhubInvoice: { select: { hostPayoutCents: true } },
      listing: { select: { cleaningFeeCents: true } },
    },
  });

  const revenueBookings = bookings.filter((b) => REVENUE_STATUSES.includes(b.status) && !b.refunded);
  // Prisma select omitted refunded - add
  const revenueBookingsSafe = await prisma.booking.findMany({
    where: {
      id: { in: revenueBookings.map((b) => b.id) },
      refunded: false,
    },
    select: { id: true },
  });
  const revenueIdSet = new Set(revenueBookingsSafe.map((r) => r.id));
  const qualifying = revenueBookings.filter((b) => revenueIdSet.has(b.id));

  const breakdown: HostRevenueBreakdownCents = {
    baseNightlyCents: 0,
    cleaningCents: 0,
    guestServiceFeeCents: 0,
  };

  let totalRevenueCents = 0;
  const monthMap = new Map<string, number>();
  const dailyMap = new Map<string, { revenue: number; occupied: number }>();
  const weeklyMap = new Map<string, { revenue: number; occupied: number }>();
  const monthlyMap = new Map<string, { revenue: number; occupied: number }>();

  const initBucket = (m: Map<string, { revenue: number; occupied: number }>, key: string) => {
    if (!m.has(key)) m.set(key, { revenue: 0, occupied: 0 });
  };

  for (const b of qualifying) {
    const hostRev = hostRevenueCentsForBooking(b);
    const nightsInWindow = overlapNights(b.checkIn, b.checkOut, start, end);
    if (nightsInWindow.length === 0) continue;

    const nightFrac = nightsInWindow.length / Math.max(1, b.nights);
    accumulateBreakdownFraction(
      { totalCents: b.totalCents, guestFeeCents: b.guestFeeCents, listing: b.listing },
      nightFrac,
      breakdown,
    );

    const perNight = hostRev / Math.max(1, b.nights);
    totalRevenueCents += Math.round(perNight * nightsInWindow.length);

    const monthKey = isoMonth(nightsInWindow[0] ?? b.checkIn);
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + Math.round(perNight * nightsInWindow.length));

    for (const night of nightsInWindow) {
      const dKey = night.toISOString().slice(0, 10);
      initBucket(dailyMap, dKey);
      const d = dailyMap.get(dKey)!;
      d.revenue += perNight;
      d.occupied += 1;

      const wKey = isoWeekKey(night);
      initBucket(weeklyMap, wKey);
      const w = weeklyMap.get(wKey)!;
      w.revenue += perNight;
      w.occupied += 1;

      const mKey = isoMonth(night);
      initBucket(monthlyMap, mKey);
      const mo = monthlyMap.get(mKey)!;
      mo.revenue += perNight;
      mo.occupied += 1;
    }
  }

  const occupiedNights = await prisma.bookingNight.count({
    where: {
      stayDate: { gte: start, lt: end },
      listingId: { in: listingIds },
      booking: { status: { in: REVENUE_STATUSES }, refunded: false },
    },
  });

  let availableNights = 0;
  for (const l of listings) {
    if (l.listingStatus !== ListingStatus.PUBLISHED) continue;
    const effectiveStart = utcDayStart(l.createdAt) > start ? utcDayStart(l.createdAt) : start;
    availableNights += daysBetweenUtc(effectiveStart, end);
  }

  const occupancyRate =
    availableNights > 0 ? Math.min(1, occupiedNights / availableNights) : null;

  const avgNightlyRateCents =
    occupiedNights > 0 ? Math.round(totalRevenueCents / occupiedNights) : null;

  const [inquiryCount, cancelledInRange, completedInRange] = await Promise.all([
    prisma.bnhubInquiryThread.count({
      where: {
        hostUserId,
        shortTermListingId: listingId ? listingId : { in: listingIds },
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.booking.count({
      where: {
        listingId: { in: listingIds },
        status: { in: CANCELLED_STATUSES },
        canceledAt: { gte: start, lt: end },
      },
    }),
    prisma.booking.count({
      where: {
        listingId: { in: listingIds },
        status: BookingStatus.COMPLETED,
        checkOut: { gte: start, lt: end },
      },
    }),
  ]);

  const bookingsWon = await prisma.booking.count({
    where: {
      listingId: { in: listingIds },
      status: { in: REVENUE_STATUSES },
      createdAt: { gte: start, lt: end },
    },
  });

  const bookingConversionRate =
    inquiryCount > 0 ? Math.min(1, bookingsWon / inquiryCount) : null;

  const cancellationDenom = cancelledInRange + completedInRange;
  const cancellationRate =
    cancellationDenom > 0 ? cancelledInRange / cancellationDenom : null;

  const revenueByMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, revenueCents]) => ({
      monthKey,
      label: monthKey,
      revenueCents: Math.round(revenueCents),
    }));

  const toPoints = (m: Map<string, { revenue: number; occupied: number }>): HostAnalyticsTimePoint[] =>
    [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        key,
        label: key,
        revenueCents: Math.round(v.revenue),
        occupiedNights: v.occupied,
      }));

  const listingBreakdown: HostListingAnalyticsRow[] = [];
  for (const l of listings) {
    const lbBookings = qualifying.filter((b) => b.listingId === l.id);
    let rev = 0;
    let occ = 0;
    for (const b of lbBookings) {
      const hostRev = hostRevenueCentsForBooking(b);
      const nightsInWindow = overlapNights(b.checkIn, b.checkOut, start, end);
      const perNight = hostRev / Math.max(1, b.nights);
      rev += Math.round(perNight * nightsInWindow.length);
      occ += nightsInWindow.length;
    }
    let avail = 0;
    if (l.listingStatus === ListingStatus.PUBLISHED) {
      const effectiveStart = utcDayStart(l.createdAt) > start ? utcDayStart(l.createdAt) : start;
      avail = daysBetweenUtc(effectiveStart, end);
    }
    const occRate = avail > 0 ? Math.min(1, occ / avail) : null;
    const adr = occ > 0 ? Math.round(rev / occ) : null;
    listingBreakdown.push({
      listingId: l.id,
      title: l.title,
      listingCode: l.listingCode,
      revenueCents: rev,
      occupiedNights: occ,
      availableNights: avail,
      occupancyRate: occRate,
      avgNightlyRateCents: adr,
      bookingCount: lbBookings.length,
    });
  }
  listingBreakdown.sort((a, b) => b.revenueCents - a.revenueCents);

  const metricExplanations: Record<string, string> = {
    totalRevenue:
      "Host-side amounts from confirmed and completed, non-refunded stays that overlap the selected dates. Uses completed Stripe host payouts when present; otherwise booking totals minus host fees.",
    occupancy:
      "Occupied guest-nights (from real bookings) divided by available guest-nights. Available nights assume one rentable unit per published listing, counted from publish/creation through the end of the range.",
    avgNightlyRate:
      "Total host revenue in the window divided by occupied guest-nights in the window (blended ADR).",
    bookingConversion:
      "Confirmed or completed bookings created in the window divided by new guest inquiry threads in the window. Guests can book without an inquiry, so this ratio is a lower bound.",
    cancellation:
      "Bookings cancelled in the window (by canceledAt) divided by cancellations plus completed stays with checkout in the window.",
    baseRevenue:
      "Portion of booking `totalCents` allocated to the nightly stay after subtracting the listing cleaning fee (capped by the booking total).",
    cleaning:
      "Per-stay cleaning attributed from the listing’s cleaning fee on file at query time (capped by each booking’s `totalCents`).",
    serviceFees:
      "Guest-paid platform service fees recorded on each booking (`guestFeeCents`).",
  };

  return {
    range: { startUtc: start.toISOString(), endUtc: end.toISOString(), days },
    listingCount: listings.length,
    totalRevenueCents: Math.round(totalRevenueCents),
    revenueByMonth,
    occupancyRate,
    occupiedNights,
    availableNights,
    avgNightlyRateCents,
    bookingConversionRate,
    cancellationRate,
    breakdown,
    series: {
      daily: toPoints(dailyMap),
      weekly: toPoints(weeklyMap),
      monthly: toPoints(monthlyMap),
    },
    listingBreakdown,
    revenueStatuses: REVENUE_STATUSES,
    metricExplanations,
  };
}

function emptyMetrics(start: Date, end: Date, days: number, listingCount: number): HostRevenueMetrics {
  const metricExplanations: HostRevenueMetrics["metricExplanations"] = {
    totalRevenue:
      "Host-side amounts from confirmed and completed, non-refunded stays that overlap the selected dates.",
    occupancy: "Occupied guest-nights divided by available guest-nights for published listings.",
    avgNightlyRate: "Host revenue divided by occupied guest-nights.",
    bookingConversion: "Bookings won divided by inquiry threads opened in the same period.",
    cancellation: "Cancellations in the period versus cancellations plus completed stays.",
    baseRevenue: "Nightly stay subtotal after cleaning allocation.",
    cleaning: "Cleaning fees from listing configuration.",
    serviceFees: "Guest-paid service fees per booking.",
  };
  return {
    range: { startUtc: start.toISOString(), endUtc: end.toISOString(), days },
    listingCount,
    totalRevenueCents: 0,
    revenueByMonth: [],
    occupancyRate: null,
    occupiedNights: 0,
    availableNights: 0,
    avgNightlyRateCents: null,
    bookingConversionRate: null,
    cancellationRate: null,
    breakdown: { baseNightlyCents: 0, cleaningCents: 0, guestServiceFeeCents: 0 },
    series: { daily: [], weekly: [], monthly: [] },
    listingBreakdown: [],
    revenueStatuses: REVENUE_STATUSES,
    metricExplanations,
  };
}

export type WeekendWeekdayAdr = {
  weekdayNights: number;
  weekendNights: number;
  weekdayAdrCents: number | null;
  weekendAdrCents: number | null;
};

/** Blended ADR split by weekend (Fri–Sun UTC) vs weekday from real occupied nights. */
export async function computeWeekendWeekdayAdr(params: {
  listingIds: string[];
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<WeekendWeekdayAdr> {
  const { listingIds, rangeStart, rangeEnd } = params;
  if (listingIds.length === 0) {
    return {
      weekdayNights: 0,
      weekendNights: 0,
      weekdayAdrCents: null,
      weekendAdrCents: null,
    };
  }
  const start = utcDayStart(rangeStart);
  const end = utcDayStart(rangeEnd);

  const rows = await prisma.bookingNight.findMany({
    where: {
      listingId: { in: listingIds },
      stayDate: { gte: start, lt: end },
      booking: { status: { in: REVENUE_STATUSES }, refunded: false },
    },
    select: {
      stayDate: true,
      booking: {
        select: {
          nights: true,
          totalCents: true,
          hostFeeCents: true,
          guestFeeCents: true,
          payment: { select: { status: true, hostPayoutCents: true } },
          bnhubInvoice: { select: { hostPayoutCents: true } },
        },
      },
    },
  });

  let weekdayRev = 0;
  let weekdayN = 0;
  let weekendRev = 0;
  let weekendN = 0;

  for (const r of rows) {
    const perNight =
      hostRevenueCentsForBooking(r.booking) / Math.max(1, r.booking.nights);
    if (weekendNight(r.stayDate)) {
      weekendRev += perNight;
      weekendN += 1;
    } else {
      weekdayRev += perNight;
      weekdayN += 1;
    }
  }

  return {
    weekdayNights: weekdayN,
    weekendNights: weekendN,
    weekdayAdrCents: weekdayN > 0 ? Math.round(weekdayRev / weekdayN) : null,
    weekendAdrCents: weekendN > 0 ? Math.round(weekendRev / weekendN) : null,
  };
}
