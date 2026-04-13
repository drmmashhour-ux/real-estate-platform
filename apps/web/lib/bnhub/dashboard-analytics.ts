import { prisma } from "@/lib/db";

/** Lifetime completed host payouts (BNHub). */
export async function getTotalEarningsCents(ownerId: string): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      status: "COMPLETED",
      booking: { listing: { ownerId } },
    },
    _sum: { hostPayoutCents: true },
  });
  return result._sum.hostPayoutCents ?? 0;
}

export async function getActiveListingsCount(ownerId: string): Promise<number> {
  return prisma.shortTermListing.count({
    where: { ownerId, listingStatus: "PUBLISHED" },
  });
}

export async function getAvgNightlyPriceCents(ownerId: string): Promise<number> {
  const agg = await prisma.shortTermListing.aggregate({
    where: { ownerId, listingStatus: "PUBLISHED" },
    _avg: { nightPriceCents: true },
  });
  return Math.round(agg._avg.nightPriceCents ?? 0);
}

export type RevenueDayPoint = { date: string; cents: number };

/** Last `days` calendar days of host payout by payment completion date. */
export async function getRevenueByDay(ownerId: string, days: number): Promise<RevenueDayPoint[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const payments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      booking: { listing: { ownerId } },
      createdAt: { gte: start },
    },
    select: { hostPayoutCents: true, paidAt: true, createdAt: true },
  });

  const bucket = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    bucket.set(d.toISOString().slice(0, 10), 0);
  }

  for (const p of payments) {
    const t = p.paidAt ?? p.createdAt;
    const key = t.toISOString().slice(0, 10);
    if (!bucket.has(key)) {
      continue;
    }
    bucket.set(key, (bucket.get(key) ?? 0) + (p.hostPayoutCents ?? 0));
  }

  return Array.from(bucket.entries()).map(([date, cents]) => ({ date, cents }));
}

export type BookingStatusSlice = { status: string; count: number };

export async function getBookingStatusBreakdown(ownerId: string): Promise<BookingStatusSlice[]> {
  const rows = await prisma.booking.groupBy({
    by: ["status"],
    where: { listing: { ownerId } },
    _count: { id: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count.id }));
}

export type HostActivityItem = {
  id: string;
  kind: "booking" | "message" | "payment" | "review";
  title: string;
  subtitle: string;
  at: string;
  href: string;
};

export async function getHostActivityFeed(ownerId: string, limit: number): Promise<HostActivityItem[]> {
  const listingIds = await prisma.shortTermListing.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const ids = listingIds.map((l) => l.id);
  if (ids.length === 0) {
    return [];
  }

  const [bookings, messages, payments, reviews] = await Promise.all([
    prisma.booking.findMany({
      where: { listingId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        createdAt: true,
        confirmationCode: true,
        listing: { select: { title: true, listingCode: true } },
      },
    }),
    prisma.bookingMessage.findMany({
      where: { booking: { listingId: { in: ids } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        body: true,
        createdAt: true,
        booking: { select: { id: true, listing: { select: { listingCode: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED", booking: { listingId: { in: ids } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        hostPayoutCents: true,
        updatedAt: true,
        bookingId: true,
      },
    }),
    prisma.review.findMany({
      where: { listingId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        listingId: true,
        propertyRating: true,
        comment: true,
        createdAt: true,
        listing: { select: { listingCode: true, title: true } },
      },
    }),
  ]);

  const items: HostActivityItem[] = [];

  for (const b of bookings) {
    items.push({
      id: `b-${b.id}`,
      kind: "booking",
      title: `Booking ${b.status}`,
      subtitle: `${b.listing.listingCode} · ${b.listing.title}`,
      at: b.createdAt.toISOString(),
      href: `/dashboard/bnhub/bookings`,
    });
  }
  for (const m of messages) {
    const snippet = m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body;
    items.push({
      id: `m-${m.id}`,
      kind: "message",
      title: "Guest message",
      subtitle: `${m.booking.listing.listingCode} — ${snippet}`,
      at: m.createdAt.toISOString(),
      href: `/dashboard/bnhub/messages`,
    });
  }
  for (const p of payments) {
    const dollars = ((p.hostPayoutCents ?? 0) / 100).toFixed(0);
    items.push({
      id: `p-${p.id}`,
      kind: "payment",
      title: `Payout $${dollars}`,
      subtitle: "Payment completed",
      at: p.updatedAt.toISOString(),
      href: `/dashboard/bnhub/bookings`,
    });
  }
  for (const r of reviews) {
    items.push({
      id: `r-${r.id}`,
      kind: "review",
      title: `Review ${r.propertyRating}★`,
      subtitle: r.listing.title + (r.comment ? ` — ${r.comment.slice(0, 60)}` : ""),
      at: r.createdAt.toISOString(),
      href: `/bnhub/listings/${r.listingId}`,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}
