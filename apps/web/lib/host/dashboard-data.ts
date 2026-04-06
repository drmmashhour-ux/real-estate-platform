import {
  AiSuggestionStatus,
  BookingStatus,
  ListingAnalyticsKind,
  ListingStatus,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";

const CANCELED_STATUSES = [
  "CANCELLED",
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "DECLINED",
  "EXPIRED",
] as const;

export type HostDashboardStats = {
  totalListings: number;
  publishedListings: number;
  activeListings: number;
  upcomingBookings: number;
  monthlyRevenueCents: number;
  totalRevenueCents: number;
  confirmedBookings: number;
  canceledBookings: number;
  occupancyRatePercent: number;
  averageNightlyRateCents: number;
  /** Rough WoW trend for earnings (-1..1 scale for badge) */
  earningsTrend: "up" | "down" | "flat";
  listingsTrend: "up" | "down" | "flat";
};

export async function getHostDashboardStats(hostId: string): Promise<HostDashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const listingWhere = { ownerId: hostId };

  const [totalListings, publishedListings, listingsAgg] = await Promise.all([
    prisma.shortTermListing.count({ where: listingWhere }),
    prisma.shortTermListing.count({
      where: { ...listingWhere, listingStatus: ListingStatus.PUBLISHED },
    }),
    prisma.shortTermListing.aggregate({
      where: listingWhere,
      _avg: { nightPriceCents: true },
    }),
  ]);

  const activeListings = publishedListings;

  const upcomingBookings = await prisma.booking.count({
    where: {
      listing: listingWhere,
      checkOut: { gte: now },
      NOT: { status: { in: [...CANCELED_STATUSES] as BookingStatus[] } },
    },
  });

  const [monthlyRevenue, prevMonthRevenue, totalRevenue, confirmedBookings, canceledBookings] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: startOfMonth },
          booking: { listing: listingWhere },
        },
        _sum: { amountCents: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
          booking: { listing: listingWhere },
        },
        _sum: { amountCents: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          booking: { listing: listingWhere },
        },
        _sum: { amountCents: true },
      }),
      prisma.booking.count({
        where: {
          listing: listingWhere,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.booking.count({
        where: {
          listing: listingWhere,
          status: { in: [...CANCELED_STATUSES] },
        },
      }),
    ]);

  const publishedIds = (
    await prisma.shortTermListing.findMany({
      where: { ...listingWhere, listingStatus: ListingStatus.PUBLISHED },
      select: { id: true },
    })
  ).map((r) => r.id);

  const horizonEnd = new Date(now.getTime() + 30 * 86400000);
  let occupancyRatePercent = 0;
  if (publishedIds.length > 0) {
    const overlapping = await prisma.booking.findMany({
      where: {
        listingId: { in: publishedIds },
        status: { in: ["CONFIRMED", "PENDING", "AWAITING_HOST_APPROVAL"] },
        checkIn: { lt: horizonEnd },
        checkOut: { gt: now },
      },
      select: { nights: true },
    });
    const sumNights = overlapping.reduce((s, b) => s + b.nights, 0);
    const capacity = publishedIds.length * 30;
    occupancyRatePercent = capacity > 0 ? Math.min(100, Math.round((sumNights / capacity) * 100)) : 0;
  }

  const m = monthlyRevenue._sum.amountCents ?? 0;
  const p = prevMonthRevenue._sum.amountCents ?? 0;
  let earningsTrend: HostDashboardStats["earningsTrend"] = "flat";
  if (m > p * 1.05) earningsTrend = "up";
  else if (p > 0 && m < p * 0.95) earningsTrend = "down";

  const listingsTrend: HostDashboardStats["listingsTrend"] =
    publishedListings > 0 && totalListings > publishedListings ? "up" : "flat";

  return {
    totalListings,
    publishedListings,
    activeListings,
    upcomingBookings,
    monthlyRevenueCents: m,
    totalRevenueCents: totalRevenue._sum.amountCents ?? 0,
    confirmedBookings,
    canceledBookings,
    occupancyRatePercent,
    averageNightlyRateCents: Math.round(listingsAgg._avg.nightPriceCents ?? 0),
    earningsTrend,
    listingsTrend,
  };
}

export type HostActivityItem = {
  id: string;
  label: string;
  detail: string;
  createdAt: Date;
};

export async function getHostRecentActivity(hostId: string, take = 10): Promise<HostActivityItem[]> {
  const events = await prisma.bnhubBookingEvent.findMany({
    where: { booking: { listing: { ownerId: hostId } } },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      booking: {
        select: {
          id: true,
          confirmationCode: true,
          listing: { select: { title: true } },
        },
      },
    },
  });

  return events.map((e) => {
    const title = e.booking.listing.title.slice(0, 40);
    const ref = e.booking.confirmationCode ?? e.booking.id.slice(0, 8);
    let label = e.eventType.replace(/_/g, " ");
    if (e.eventType === "created") label = "Booking created";
    if (e.eventType.includes("cancel")) label = "Booking canceled";
    if (e.eventType.includes("confirmed") || e.eventType === "payment_pending")
      label = "Booking / payment update";
    return {
      id: e.id,
      label,
      detail: `${title} · ${ref}`,
      createdAt: e.createdAt,
    };
  });
}

export type HostListingPerformanceRow = {
  listingId: string;
  title: string;
  city: string;
  views: number;
  bookings: number;
  conversionPercent: number;
  nightPriceCents: number;
};

export async function getHostListingPerformanceTop(hostId: string, limit = 3): Promise<HostListingPerformanceRow[]> {
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: { id: true, title: true, city: true, nightPriceCents: true },
  });
  if (!listings.length) return [];

  const ids = listings.map((l) => l.id);
  const analytics = await prisma.listingAnalytics.findMany({
    where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: ids } },
  });
  const byId = new Map(analytics.map((a) => [a.listingId, a]));

  const rows: HostListingPerformanceRow[] = listings.map((l) => {
    const a = byId.get(l.id);
    const views = a?.viewsTotal ?? 0;
    const bookings = a?.bookings ?? 0;
    const conversionPercent =
      views > 0 ? Math.min(100, Math.round((bookings / Math.max(views, 1)) * 100 * 10)) : 0;
    return {
      listingId: l.id,
      title: l.title,
      city: l.city,
      views,
      bookings,
      conversionPercent,
      nightPriceCents: l.nightPriceCents,
    };
  });

  rows.sort((a, b) => b.bookings - a.bookings || b.views - a.views);
  return rows.slice(0, limit);
}

export type HostAiSuggestion = {
  id: string;
  title: string;
  body: string;
  actionLabel?: string;
  href?: string;
  /** Persisted BNHub AI suggestion — enables Apply / Dismiss in UI */
  suggestionId?: string;
  confidence?: number | null;
};

/** Mixes DB `AiSuggestion` rows with heuristics from listing/booking stats. */
export async function getHostAiSuggestions(hostId: string): Promise<HostAiSuggestion[]> {
  const dbRows = await prisma.aiSuggestion.findMany({
    where: { hostId, status: AiSuggestionStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, title: true, description: true, listingId: true, confidenceScore: true },
  });

  const suggestions: HostAiSuggestion[] = dbRows.map((r) => ({
    id: `db-${r.id}`,
    title: r.title,
    body: r.description,
    actionLabel: "Review",
    href: r.listingId ? `/bnhub/host/listings/${r.listingId}/edit` : "/host/pricing",
    suggestionId: r.id,
    confidence: r.confidenceScore,
  }));

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: {
      id: true,
      title: true,
      nightPriceCents: true,
      listingPhotos: { select: { id: true }, take: 4 },
    },
  });

  if (suggestions.length < 5) {
    const lowPhotos = listings.filter((l) => l.listingPhotos.length < 5);
    if (lowPhotos[0]) {
      suggestions.push({
        id: "photos",
        title: "Add more photos",
        body: `Listings with 8+ photos convert better. "${lowPhotos[0].title.slice(0, 32)}…" could use at least 3 more.`,
        actionLabel: "Review",
        href: `/bnhub/host/listings/${lowPhotos[0].id}/edit`,
      });
    }
  }

  if (suggestions.length < 5) {
    const weekend = new Date();
    weekend.setUTCDate(weekend.getUTCDate() + ((6 - weekend.getUTCDay() + 7) % 7 || 7));
    suggestions.push({
      id: "weekend-price",
      title: "Increase price this weekend",
      body: `Demand often peaks ${weekend.toISOString().slice(0, 10)}. Try +5–12% if you still have availability.`,
      actionLabel: "Review",
      href: listings[0] ? `/bnhub/host/pricing/listings/${listings[0].id}` : "/host/listings",
    });
  }

  if (suggestions.length < 5) {
    const cheap = listings.filter((l) => l.nightPriceCents > 0 && l.nightPriceCents < 8000);
    if (cheap[0]) {
      suggestions.push({
        id: "underpriced",
        title: "Possible underpricing",
        body: `"${cheap[0].title.slice(0, 40)}" is below typical weekend bands in many markets — validate comps.`,
        actionLabel: "Review",
        href: `/bnhub/host/pricing/listings/${cheap[0].id}`,
      });
    }
  }

  if (suggestions.length < 4) {
    suggestions.push({
      id: "response",
      title: "Faster guest replies",
      body: "Hosts who respond within an hour see fewer abandoned checkouts.",
      actionLabel: "Open inbox",
      href: "/dashboard/bnhub/messages",
    });
  }

  return suggestions.slice(0, 6);
}

export type HostDashboardUpcomingBooking = {
  id: string;
  guestName: string;
  propertyTitle: string;
  checkIn: Date;
  checkOut: Date;
  totalCents: number | null;
  status: string;
  paymentStatus: string | null;
};

export async function getHostUpcomingBookings(hostId: string, take = 5): Promise<HostDashboardUpcomingBooking[]> {
  const now = new Date();
  const rows = await prisma.booking.findMany({
    where: {
      listing: { ownerId: hostId },
      checkOut: { gte: now },
      status: { notIn: [...CANCELED_STATUSES] },
    },
    orderBy: { checkIn: "asc" },
    take,
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      guestsCount: true,
      guestContactName: true,
      guestContactEmail: true,
      guest: { select: { name: true, email: true } },
      listing: { select: { title: true } },
      payment: { select: { amountCents: true, status: true } },
    },
  });

  return rows.map((b) => ({
    id: b.id,
    guestName:
      b.guestContactName?.trim() ||
      b.guest?.name?.trim() ||
      b.guest?.email ||
      b.guestContactEmail ||
      "Guest",
    propertyTitle: b.listing.title,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    totalCents: b.payment?.amountCents ?? null,
    status: b.status,
    paymentStatus: b.payment?.status ?? null,
  }));
}
