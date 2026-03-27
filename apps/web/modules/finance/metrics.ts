/**
 * Platform revenue aggregation — ledger-first, payment fallback.
 */

import { prisma } from "@/lib/db";
import type {
  FinancialModelPayload,
  FinancialPeriod,
  MonthlyBucket,
  RevenueBySource,
  RevenueSourceKey,
  UserStats,
} from "./financial-model-types";
import { applyDemoFinancialFallback } from "./demo-financial-data";

const SOURCE_LABELS: Record<RevenueSourceKey, string> = {
  buyer: "Buyer",
  seller: "Seller",
  bnhub: "BNHub",
  broker: "Broker",
  rent: "Rent / deals",
  other: "Other",
};

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-CA", { month: "short", year: "numeric" });
}

export function mapToRevenueSource(category: string, paymentType: string): RevenueSourceKey {
  const c = category.toLowerCase();
  const p = paymentType.toLowerCase();
  if (p === "booking" || c.includes("booking")) return "bnhub";
  if (p === "fsbo_publish" || c.includes("fsbo") || p === "featured_listing" || c.includes("featured"))
    return "seller";
  if (p === "subscription" || c.includes("subscription")) return "buyer";
  if (p === "mortgage_contact_unlock" || c.includes("mortgage")) return "buyer";
  if (p === "lead_unlock" || c.includes("lead")) return "broker";
  if (p === "deposit" || p === "closing_fee" || c.includes("deposit") || c.includes("closing")) return "rent";
  return "other";
}

function mapRevenueEventType(revenueType: string, entityType: string): RevenueSourceKey {
  const r = revenueType.toLowerCase();
  const e = entityType.toLowerCase();
  if (r.includes("host") || r.includes("guest") || e === "booking") return "bnhub";
  if (r.includes("subscription")) return "buyer";
  if (r.includes("transaction")) return "rent";
  return "other";
}

function emptyMonthlySeries(keys: string[]): MonthlyBucket[] {
  return keys.map((k) => ({ monthKey: k, label: monthLabel(k), cents: 0 }));
}

function mergeMonthInto(
  map: Map<string, number>,
  d: Date,
  cents: number
): void {
  const k = monthKey(d);
  map.set(k, (map.get(k) ?? 0) + cents);
}

export async function getUserStats(): Promise<UserStats> {
  const [buyers, sellers, hosts, brokers, totalUsers] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "SELLER_DIRECT" } }),
    prisma.user.count({ where: { role: "HOST" } }),
    prisma.user.count({ where: { role: "BROKER" } }),
    prisma.user.count(),
  ]);
  return { buyers, sellers, hosts, brokers, totalUsers };
}

/**
 * Aggregated platform revenue by logical source for a date range.
 */
export async function getRevenueBySource(period: FinancialPeriod): Promise<RevenueBySource[]> {
  const w = { gte: period.start, lte: period.end };

  const ledgerRows = await prisma.partyRevenueLedgerEntry.findMany({
    where: {
      party: "PLATFORM",
      platformPayment: { status: "paid", createdAt: w },
    },
    select: {
      amountCents: true,
      category: true,
      platformPayment: { select: { createdAt: true, paymentType: true } },
    },
  });

  const bySource = new Map<RevenueSourceKey, number>();
  const monthlyBySource = new Map<RevenueSourceKey, Map<string, number>>();

  const initSource = (s: RevenueSourceKey) => {
    if (!bySource.has(s)) bySource.set(s, 0);
    if (!monthlyBySource.has(s)) monthlyBySource.set(s, new Map());
  };

  for (const row of ledgerRows) {
    const src = mapToRevenueSource(row.category, row.platformPayment.paymentType);
    initSource(src);
    bySource.set(src, (bySource.get(src) ?? 0) + row.amountCents);
    const m = monthlyBySource.get(src)!;
    mergeMonthInto(m, row.platformPayment.createdAt, row.amountCents);
  }

  const payFallback = await prisma.platformPayment.findMany({
    where: {
      status: "paid",
      createdAt: w,
      partyRevenueLedgerEntries: { none: {} },
    },
    select: {
      amountCents: true,
      platformFeeCents: true,
      paymentType: true,
      createdAt: true,
    },
  });

  for (const p of payFallback) {
    const gross = p.paymentType === "booking" ? p.platformFeeCents ?? p.amountCents : p.amountCents;
    if (gross <= 0) continue;
    const src = mapToRevenueSource("", p.paymentType);
    initSource(src);
    bySource.set(src, (bySource.get(src) ?? 0) + gross);
    const m = monthlyBySource.get(src)!;
    mergeMonthInto(m, p.createdAt, gross);
  }

  const revEvents = await prisma.platformRevenueEvent.findMany({
    where: { status: "realized", createdAt: w },
    select: { amountCents: true, revenueType: true, entityType: true, createdAt: true },
  });

  for (const ev of revEvents) {
    const src = mapRevenueEventType(ev.revenueType, ev.entityType);
    initSource(src);
    bySource.set(src, (bySource.get(src) ?? 0) + ev.amountCents);
    const m = monthlyBySource.get(src)!;
    mergeMonthInto(m, ev.createdAt, ev.amountCents);
  }

  const keys: RevenueSourceKey[] = ["buyer", "seller", "bnhub", "broker", "rent", "other"];
  const allMonthKeys = new Set<string>();
  for (const m of monthlyBySource.values()) {
    for (const k of m.keys()) allMonthKeys.add(k);
  }
  const sortedMonths = [...allMonthKeys].sort();

  const result: RevenueBySource[] = keys.map((source) => {
    const totalCents = bySource.get(source) ?? 0;
    const mm = monthlyBySource.get(source) ?? new Map();
    const monthly: MonthlyBucket[] =
      sortedMonths.length > 0
        ? sortedMonths.map((monthKey) => ({
            monthKey,
            label: monthLabel(monthKey),
            cents: mm.get(monthKey) ?? 0,
          }))
        : emptyMonthlySeries([]);
    return {
      source,
      label: SOURCE_LABELS[source],
      totalCents,
      monthly,
    };
  });

  return result;
}

export async function getBookingVolume(period: FinancialPeriod): Promise<{ count: number; grossCents: number }> {
  const w = { gte: period.start, lte: period.end };
  const [count, payments] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: w },
    }),
    prisma.platformPayment.aggregate({
      where: { status: "paid", paymentType: "booking", createdAt: w },
      _sum: { amountCents: true },
    }),
  ]);
  return { count, grossCents: payments._sum.amountCents ?? 0 };
}

export async function getSellerRevenue(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.find((r) => r.source === "seller")?.totalCents ?? 0;
}

export async function getBrokerRevenue(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.find((r) => r.source === "broker")?.totalCents ?? 0;
}

export async function getBNHubRevenue(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.find((r) => r.source === "bnhub")?.totalCents ?? 0;
}

export async function getRentRevenue(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.find((r) => r.source === "rent")?.totalCents ?? 0;
}

export async function getBuyerRevenue(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.find((r) => r.source === "buyer")?.totalCents ?? 0;
}

export async function getTotalPlatformRevenueCents(period: FinancialPeriod): Promise<number> {
  const rows = await getRevenueBySource(period);
  return rows.reduce((s, r) => s + r.totalCents, 0);
}

export async function getMonthlyRevenueTotals(period: FinancialPeriod): Promise<MonthlyBucket[]> {
  const rows = await getRevenueBySource(period);
  const monthMap = new Map<string, number>();
  for (const r of rows) {
    for (const m of r.monthly) {
      monthMap.set(m.monthKey, (monthMap.get(m.monthKey) ?? 0) + m.cents);
    }
  }
  const keys = [...monthMap.keys()].sort();
  return keys.map((k) => ({ monthKey: k, label: monthLabel(k), cents: monthMap.get(k) ?? 0 }));
}

export async function getPlatformRevenueEventsTotal(period: FinancialPeriod): Promise<number> {
  const w = { gte: period.start, lte: period.end };
  const agg = await prisma.platformRevenueEvent.aggregate({
    where: { status: "realized", createdAt: w },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

export async function buildFinancialModelPayload(period: FinancialPeriod): Promise<FinancialModelPayload> {
  const [userStats, revenueBySource, bookingVolume, monthlyRevenueTotal, platformRevenueEventsCents] =
    await Promise.all([
      getUserStats(),
      getRevenueBySource(period),
      getBookingVolume(period),
      getMonthlyRevenueTotals(period),
      getPlatformRevenueEventsTotal(period),
    ]);

  const totalRevenueCents = revenueBySource.reduce((s, r) => s + r.totalCents, 0);

  return applyDemoFinancialFallback({
    period,
    userStats,
    revenueBySource,
    totalRevenueCents,
    bookingVolume,
    demoMode: false,
    monthlyRevenueTotal,
    platformRevenueEventsCents,
  });
}
