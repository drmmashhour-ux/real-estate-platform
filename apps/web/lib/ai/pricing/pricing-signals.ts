import type { PrismaClient } from "@prisma/client";
import { BnhubDayAvailabilityStatus, ListingStatus } from "@prisma/client";

const BOOKING_STATUSES_FOR_SIGNALS = [
  "CONFIRMED",
  "COMPLETED",
  "PENDING",
  "AWAITING_HOST_APPROVAL",
] as const;

/** Same “activity” window as revenue optimizer — real bookings only. */
export function bookingStatusesForPricingSignals(): readonly string[] {
  return BOOKING_STATUSES_FOR_SIGNALS;
}

export type BnhubPricingSignals = {
  listingId: string;
  hostId: string;
  title: string;
  listingStatus: ListingStatus;
  isPublished: boolean;
  currentNightlyPriceCents: number;
  currency: string;
  recentBookingCount30d: number;
  recentBookingCount90d: number;
  /** Days since last qualifying booking by `createdAt`, or null if none. */
  daysSinceLastBooking: number | null;
  /** Share of last 30 nights booked (single unit), from real `nights` sums; null if not published. */
  occupancyEstimate: number | null;
  activePromotionExists: boolean;
  /**
   * Longest consecutive stretch of calendar days marked AVAILABLE for sale in the next horizon.
   * Large value ⇒ many unsold nights ahead (when calendar rows exist).
   */
  upcomingAvailabilityGapDays: number | null;
  /** From `ListingSearchMetrics` when present. */
  recentViews7d: number | null;
  recentViews30d: number | null;
  /** BNHub leads tied to the listing in the last 30 days. */
  inquiryCount30d: number | null;
  /**
   * 0–1 variability of internal historical booking nights by calendar month; null if insufficient data.
   * Never used as external “demand”; diagnostic / confidence only.
   */
  seasonalityProxyFromBookings: number | null;
  /** Prefer `BnhubPropertyClassification.overallScore`, else listing `aiDiscoveryScore`. */
  listingQualityScore: number | null;
  photoCount: number;
  descriptionLength: number;
};

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

/**
 * Longest run of consecutive days where each row is sellable (available + AVAILABLE status).
 */
export function longestAvailableStreakDays(
  slots: { date: Date; available: boolean; dayStatus: BnhubDayAvailabilityStatus }[],
): number {
  if (!slots.length) return 0;
  const sorted = [...slots].sort((a, b) => a.date.getTime() - b.date.getTime());
  let best = 0;
  let cur = 0;
  for (const row of sorted) {
    const ok = row.available && row.dayStatus === BnhubDayAvailabilityStatus.AVAILABLE;
    if (ok) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

function computeSeasonalityProxyFromBookings(
  bookings: { checkIn: Date; nights: number }[],
): number | null {
  if (bookings.length < 6) return null;
  const byMonth = new Array(12).fill(0);
  for (const b of bookings) {
    byMonth[b.checkIn.getMonth()] += b.nights;
  }
  const activeMonths = byMonth.filter((n: number) => n > 0).length;
  if (activeMonths < 3) return null;
  const mean = byMonth.reduce((a: number, b: number) => a + b, 0) / 12;
  if (mean < 0.5) return null;
  const max = Math.max(...byMonth);
  const mins = byMonth.filter((n: number) => n > 0);
  const min = mins.length ? Math.min(...mins) : 0;
  return Math.min(1, (max - min) / (mean + 0.01));
}

function photosFromJson(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string");
}

/**
 * Loads only real platform fields. Returns null if the listing is missing or not owned by `hostId`.
 */
export async function loadBnhubPricingSignals(
  db: PrismaClient,
  listingId: string,
  hostId: string,
): Promise<BnhubPricingSignals | null> {
  const row = await db.shortTermListing.findFirst({
    where: { id: listingId, ownerId: hostId },
    select: {
      id: true,
      title: true,
      listingStatus: true,
      nightPriceCents: true,
      currency: true,
      description: true,
      photos: true,
      aiDiscoveryScore: true,
      bnhubPropertyClassification: { select: { overallScore: true } },
      listingSearchMetrics: { select: { views7d: true, views30d: true } },
      _count: { select: { listingPhotos: true } },
    },
  });
  if (!row) return null;

  const now = Date.now();
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
  const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;
  const cutoff365 = now - 365 * 24 * 60 * 60 * 1000;

  const bookingRows = await db.booking.findMany({
    where: {
      listingId: row.id,
      status: { in: [...BOOKING_STATUSES_FOR_SIGNALS] },
      createdAt: { gte: new Date(cutoff90) },
    },
    select: { createdAt: true, nights: true, checkIn: true },
  });

  const b30 = bookingRows.filter((b) => b.createdAt.getTime() >= cutoff30);
  const recentBookingCount30d = b30.length;
  const recentBookingCount90d = bookingRows.length;
  const nightsBookedLast30d = b30.reduce((s, b) => s + b.nights, 0);

  const lastBook = bookingRows.length
    ? bookingRows.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null;
  const daysSinceLastBooking = lastBook
    ? Math.floor((now - lastBook.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const isPublished = row.listingStatus === ListingStatus.PUBLISHED;
  const occupancyEstimate = isPublished ? Math.min(1, nightsBookedLast30d / 30) : null;

  const today = startOfUtcDay(new Date());
  const horizonStart = addUtcDays(today, 1);
  const horizonEnd = addUtcDays(today, 60);

  const [promoHit, slots, leadCount, seasonalBookings] = await Promise.all([
    db.bnhubHostListingPromotion.findFirst({
      where: {
        listingId: row.id,
        active: true,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: { id: true },
    }),
    db.availabilitySlot.findMany({
      where: { listingId: row.id, date: { gte: horizonStart, lte: horizonEnd } },
      select: { date: true, available: true, dayStatus: true },
    }),
    db.bnhubLead.count({
      where: {
        listingId: row.id,
        createdAt: { gte: new Date(cutoff30) },
      },
    }),
    db.booking.findMany({
      where: {
        listingId: row.id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        checkIn: { gte: new Date(cutoff365) },
      },
      select: { checkIn: true, nights: true },
    }),
  ]);

  const upcomingAvailabilityGapDays = slots.length ? longestAvailableStreakDays(slots) : null;

  const jsonPhotos = photosFromJson(row.photos);
  const photoCount = Math.max(jsonPhotos.length, row._count.listingPhotos ?? 0);

  const listingQualityScore =
    row.bnhubPropertyClassification?.overallScore ?? row.aiDiscoveryScore ?? null;

  return {
    listingId: row.id,
    hostId,
    title: row.title,
    listingStatus: row.listingStatus,
    isPublished,
    currentNightlyPriceCents: row.nightPriceCents,
    currency: row.currency,
    recentBookingCount30d,
    recentBookingCount90d,
    daysSinceLastBooking,
    occupancyEstimate,
    activePromotionExists: Boolean(promoHit),
    upcomingAvailabilityGapDays,
    recentViews7d: row.listingSearchMetrics?.views7d ?? null,
    recentViews30d: row.listingSearchMetrics?.views30d ?? null,
    inquiryCount30d: leadCount,
    seasonalityProxyFromBookings: computeSeasonalityProxyFromBookings(seasonalBookings),
    listingQualityScore,
    photoCount,
    descriptionLength: (row.description ?? "").trim().length,
  };
}
