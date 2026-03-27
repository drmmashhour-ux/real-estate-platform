/**
 * Revenue Intelligence Layer – track, aggregate, and report all revenue sources.
 * Connects bookings, payments, subscriptions, promotions, referrals, refunds.
 */
import { prisma } from "@/lib/db";
import type { RevenueLedgerType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type { RevenueLedgerType };

/** Record a revenue or cost entry (booking commission, subscription, promotion, referral cost, refund). */
export async function recordRevenueEntry(params: {
  type: RevenueLedgerType;
  entityType: string;
  entityId: string;
  amountCents: number;
  marketId?: string;
  module?: string;
  userId?: string;
  metadata?: object;
}) {
  return prisma.revenueLedgerEntry.create({
    data: {
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      amountCents: params.amountCents,
      marketId: params.marketId,
      module: params.module,
      userId: params.userId,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
}

/** Aggregate revenue by type and optional market/module for a date range. */
export async function getRevenueSummary(params: {
  periodStart: Date;
  periodEnd: Date;
  marketId?: string;
  module?: string;
}) {
  const where: Prisma.RevenueLedgerEntryWhereInput = {
    createdAt: { gte: params.periodStart, lte: params.periodEnd },
  };
  if (params.marketId) where.marketId = params.marketId;
  if (params.module) where.module = params.module;

  const entries = await prisma.revenueLedgerEntry.findMany({
    where,
    select: { type: true, amountCents: true },
  });

  const byType: Record<string, number> = {};
  let totalCents = 0;
  for (const e of entries) {
    byType[e.type] = (byType[e.type] ?? 0) + e.amountCents;
    totalCents += e.amountCents;
  }
  return {
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    marketId: params.marketId,
    module: params.module,
    byType,
    totalCents,
  };
}

/** Get revenue ledger entries (paginated) for reporting and audit. */
export async function getRevenueLedger(params: {
  periodStart?: Date;
  periodEnd?: Date;
  type?: RevenueLedgerType;
  marketId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.RevenueLedgerEntryWhereInput = {};
  if (params.periodStart || params.periodEnd) {
    where.createdAt = {};
    if (params.periodStart) where.createdAt.gte = params.periodStart;
    if (params.periodEnd) where.createdAt.lte = params.periodEnd;
  }
  if (params.type) where.type = params.type;
  if (params.marketId) where.marketId = params.marketId;

  const [entries, total] = await Promise.all([
    prisma.revenueLedgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
      include: { market: { select: { code: true, name: true } } },
    }),
    prisma.revenueLedgerEntry.count({ where }),
  ]);
  return { entries, total };
}

/** Create or update a stored revenue report (for caching/export). */
export async function saveRevenueReport(params: {
  reportType: string;
  periodStart: Date;
  periodEnd: Date;
  marketId?: string;
  data: Record<string, unknown>;
}) {
  return prisma.revenueReport.create({
    data: {
      reportType: params.reportType,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      marketId: params.marketId,
      data: params.data as object,
    },
  });
}

/** Get saved revenue reports. */
export async function getRevenueReports(params: {
  reportType?: string;
  marketId?: string;
  limit?: number;
}) {
  const where: Prisma.RevenueReportWhereInput = {};
  if (params.reportType) where.reportType = params.reportType;
  if (params.marketId) where.marketId = params.marketId;
  return prisma.revenueReport.findMany({
    where,
    orderBy: { periodStart: "desc" },
    take: params.limit ?? 20,
  });
}
