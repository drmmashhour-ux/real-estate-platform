import { BookingStatus, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SnapshotInputRow = {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
};

export type ComputedKpis = {
  /** Optional when no new users or spend not configured. */
  cac: number | null;
  conversionRate: number;
  bookingRate: number;
  revenuePerUser: number;
  activeUsersPct: number;
};

export type MarketplaceMetrics = {
  buyerPersonaUsers: number;
  totalListings: number;
  buyersToListingsRatio: number;
  /** Listings per demand signal (leads + buyer requests created in window). */
  supplyDemandIndex: number;
  brokerResponseRate: number;
  brokerResponseSampleSize: number;
};

/** Start of UTC calendar day. */
export function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Core KPI math (testable). `bookings` and `revenue` are for the same window as `activeUsers` (e.g. 30d).
 */
export function computeKpisFromInputs(p: {
  totalUsers: number;
  activeUsers: number;
  bookingsWindow: number;
  revenueWindow: number;
  conversionRate: number;
  marketingSpendWindow: number;
  newUsersWindow: number;
}): ComputedKpis {
  const cac =
    p.newUsersWindow > 0 && p.marketingSpendWindow > 0 ? p.marketingSpendWindow / p.newUsersWindow : null;
  const bookingRate = p.activeUsers > 0 ? p.bookingsWindow / p.activeUsers : 0;
  const revenuePerUser = p.activeUsers > 0 ? p.revenueWindow / p.activeUsers : 0;
  const activeUsersPct = p.totalUsers > 0 ? (100 * p.activeUsers) / p.totalUsers : 0;
  return {
    cac,
    conversionRate: p.conversionRate,
    bookingRate,
    revenuePerUser,
    activeUsersPct,
  };
}

/**
 * Aggregate counts for a daily `MetricSnapshot` row. Window = rolling 30d ending `asOf`.
 */
export async function aggregateSnapshotInputs(asOf: Date): Promise<SnapshotInputRow> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [
    totalUsers,
    activeUsers,
    bnhubPublished,
    fsboActive,
    bookings30d,
    revenueAgg,
    won30,
    lost30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        accountStatus: "ACTIVE",
        updatedAt: { gte: since30 },
      },
    }),
    prisma.shortTermListing.count({
      where: { listingStatus: ListingStatus.PUBLISHED },
    }),
    prisma.fsboListing.count({
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    }),
    prisma.booking.count({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        createdAt: { gte: since30, lte: asOf },
      },
    }),
    prisma.revenueEvent.aggregate({
      where: { createdAt: { gte: since30, lte: asOf } },
      _sum: { amount: true },
    }),
    prisma.lead.count({
      where: { wonAt: { gte: since30, lte: asOf } },
    }),
    prisma.lead.count({
      where: { lostAt: { gte: since30, lte: asOf } },
    }),
  ]);

  const closed = won30 + lost30;
  const conversionRate = closed > 0 ? won30 / closed : 0;
  const revenue = revenueAgg._sum.amount ?? 0;

  return {
    totalUsers,
    activeUsers,
    totalListings: bnhubPublished + fsboActive,
    bookings: bookings30d,
    revenue,
    conversionRate,
  };
}

export async function getMarketingAndGrowthInputs(asOf: Date): Promise<{
  marketingSpend30d: number;
  newUsers30d: number;
}> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const spend = Number(process.env.INVESTOR_MARKETING_SPEND_30D ?? "0");
  const newUsers30d = await prisma.user.count({
    where: { createdAt: { gte: since30, lte: asOf } },
  });
  return { marketingSpend30d: Number.isFinite(spend) ? spend : 0, newUsers30d };
}

export async function computeLiveKpis(asOf: Date): Promise<ComputedKpis> {
  const row = await aggregateSnapshotInputs(asOf);
  const { marketingSpend30d, newUsers30d } = await getMarketingAndGrowthInputs(asOf);
  return computeKpisFromInputs({
    totalUsers: row.totalUsers,
    activeUsers: row.activeUsers,
    bookingsWindow: row.bookings,
    revenueWindow: row.revenue,
    conversionRate: row.conversionRate,
    marketingSpendWindow: marketingSpend30d,
    newUsersWindow: newUsers30d,
  });
}

export async function getMarketplaceMetrics(asOf: Date): Promise<MarketplaceMetrics> {
  const end = utcDayStart(asOf);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [
    buyerPersonaUsers,
    bnhubPublished,
    fsboActive,
    leads30d,
    buyerRequests30d,
    assignedLeads,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        OR: [{ role: "BUYER" }, { marketplacePersona: "BUYER" }],
        accountStatus: "ACTIVE",
      },
    }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.fsboListing.count({
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    }),
    prisma.lead.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    prisma.buyerRequest.count({ where: { createdAt: { gte: since30, lte: asOf } } }),
    prisma.lead.findMany({
      where: {
        introducedByBrokerId: { not: null },
        createdAt: { gte: since30, lte: asOf },
      },
      select: { createdAt: true, firstContactAt: true },
    }),
  ]);

  const totalListings = bnhubPublished + fsboActive;
  const demand = Math.max(1, leads30d + buyerRequests30d);
  const buyersToListingsRatio = totalListings > 0 ? buyerPersonaUsers / totalListings : buyerPersonaUsers;

  const fast = assignedLeads.filter(
    (l) =>
      l.firstContactAt != null &&
      l.firstContactAt.getTime() - l.createdAt.getTime() <= 24 * 3600 * 1000
  ).length;
  const brokerResponseRate = assignedLeads.length > 0 ? fast / assignedLeads.length : 0;

  return {
    buyerPersonaUsers,
    totalListings,
    buyersToListingsRatio,
    supplyDemandIndex: totalListings / demand,
    brokerResponseRate,
    brokerResponseSampleSize: assignedLeads.length,
  };
}

export function formatInvestorReportText(p: {
  snapshotDate: string;
  snapshot: SnapshotInputRow;
  kpis: ComputedKpis;
  marketplace: MarketplaceMetrics;
}): string {
  const lines = [
    `LECIPM Investor metrics — ${p.snapshotDate}`,
    "",
    "Snapshot (30d window where noted)",
    `  Total users: ${p.snapshot.totalUsers}`,
    `  Active users (30d touch): ${p.snapshot.activeUsers}`,
    `  Total live listings (BNHUB + FSBO): ${p.snapshot.totalListings}`,
    `  Bookings (confirmed/completed, 30d): ${p.snapshot.bookings}`,
    `  Revenue events sum (30d): ${p.snapshot.revenue.toFixed(2)}`,
    `  Lead win conversion (won/(won+lost), 30d): ${(p.snapshot.conversionRate * 100).toFixed(1)}%`,
    "",
    "KPIs",
    `  CAC (spend/new users, 30d): ${p.kpis.cac != null ? p.kpis.cac.toFixed(2) : "n/a"}`,
    `  Booking rate (bookings/active users): ${p.kpis.bookingRate.toFixed(4)}`,
    `  Revenue per active user: ${p.kpis.revenuePerUser.toFixed(2)}`,
    `  Active users %: ${p.kpis.activeUsersPct.toFixed(1)}%`,
    "",
    "Marketplace",
    `  Buyer-persona users: ${p.marketplace.buyerPersonaUsers}`,
    `  Buyers / listings ratio: ${p.marketplace.buyersToListingsRatio.toFixed(2)}`,
    `  Supply/demand index (listings / demand signals): ${p.marketplace.supplyDemandIndex.toFixed(2)}`,
    `  Broker response ≤24h (assigned leads sample): ${(p.marketplace.brokerResponseRate * 100).toFixed(1)}% (n=${p.marketplace.brokerResponseSampleSize})`,
    "",
    "LECIPM INVESTOR SYSTEM READY",
  ];
  return lines.join("\n");
}
