import {
  BookingStatus,
  ListingStatus,
  PaymentStatus,
  SearchEventType,
} from "@prisma/client";
import { prisma } from "@/lib/db";

function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

export type DominationMetrics = {
  generatedAt: string;
  stays: {
    publishedTotal: number;
    published7d: number;
    published30d: number;
    draftCreated7d: number;
  };
  bookings: {
    paid7d: number;
    revenue7dCents: number;
  };
  traffic: {
    bnhubListingViews7d: number;
    signups7d: number;
  };
  content: {
    machinePieces7d: number;
    machinePieces30d: number;
  };
  funnel7d: Record<string, number>;
};

/**
 * Cross-surface KPIs for the LECIPM + BNHUB growth loop (listings → traffic → conversion → content).
 */
export async function loadDominationMetrics(): Promise<DominationMetrics> {
  const d7 = sinceDays(7);
  const d30 = sinceDays(30);

  const [
    publishedTotal,
    published7d,
    published30d,
    draftCreated7d,
    paidBookings7d,
    paymentAgg,
    views7d,
    signups7d,
    m7,
    m30,
    funnelGrouped,
  ] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({
      where: { listingStatus: ListingStatus.PUBLISHED, createdAt: { gte: d7 } },
    }),
    prisma.shortTermListing.count({
      where: { listingStatus: ListingStatus.PUBLISHED, createdAt: { gte: d30 } },
    }),
    prisma.shortTermListing.count({
      where: { listingStatus: ListingStatus.DRAFT, createdAt: { gte: d7 } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: d7 },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        payment: { status: PaymentStatus.COMPLETED },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
        updatedAt: { gte: d7 },
      },
      _sum: { amountCents: true },
    }),
    prisma.searchEvent.count({
      where: { eventType: SearchEventType.VIEW, createdAt: { gte: d7 } },
    }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.machineGeneratedContent.count({ where: { createdAt: { gte: d7 } } }),
    prisma.machineGeneratedContent.count({ where: { createdAt: { gte: d30 } } }),
    prisma.analyticsFunnelEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: d7 } },
      _count: { id: true },
    }),
  ]);

  const funnel7d: Record<string, number> = {};
  for (const row of funnelGrouped) {
    funnel7d[row.name] = row._count.id;
  }

  return {
    generatedAt: new Date().toISOString(),
    stays: {
      publishedTotal,
      published7d,
      published30d,
      draftCreated7d,
    },
    bookings: {
      paid7d: paidBookings7d,
      revenue7dCents: paymentAgg._sum.amountCents ?? 0,
    },
    traffic: {
      bnhubListingViews7d: views7d,
      signups7d,
    },
    content: {
      machinePieces7d: m7,
      machinePieces30d: m30,
    },
    funnel7d,
  };
}
