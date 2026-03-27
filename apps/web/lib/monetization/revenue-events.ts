/**
 * Platform revenue events – audit log for every revenue event.
 */

import { prisma } from "@/lib/db";

export async function recordRevenueEvent(params: {
  entityType: string;
  entityId: string;
  revenueType: string;
  amountCents: number;
  currency?: string;
  status?: string;
  sourceReference?: string | null;
  marketId?: string | null;
}) {
  return prisma.platformRevenueEvent.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      revenueType: params.revenueType,
      amountCents: params.amountCents,
      currency: params.currency ?? "USD",
      status: params.status ?? "realized",
      sourceReference: params.sourceReference ?? undefined,
      marketId: params.marketId ?? undefined,
    },
  });
}

export async function getRevenueEvents(params: {
  entityType?: string;
  entityId?: string;
  revenueType?: string;
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.revenueType) where.revenueType = params.revenueType;
  if (params.status) where.status = params.status;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) (where.createdAt as Record<string, Date>).gte = params.from;
    if (params.to) (where.createdAt as Record<string, Date>).lte = params.to;
  }
  return prisma.platformRevenueEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}

export async function getRevenueSummary(params: { from?: Date; to?: Date; marketId?: string }) {
  const where: Record<string, unknown> = { status: "realized" };
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) (where.createdAt as Record<string, Date>).gte = params.from;
    if (params.to) (where.createdAt as Record<string, Date>).lte = params.to;
  }
  if (params.marketId) where.marketId = params.marketId;

  const events = await prisma.platformRevenueEvent.findMany({
    where,
    select: { revenueType: true, amountCents: true },
  });

  const byType: Record<string, number> = {};
  let totalCents = 0;
  for (const e of events) {
    byType[e.revenueType] = (byType[e.revenueType] ?? 0) + e.amountCents;
    totalCents += e.amountCents;
  }
  return { totalCents, byType, eventCount: events.length };
}

export type RevenueReportParams = {
  from?: Date;
  to?: Date;
  marketId?: string;
  revenueType?: string;
  limit?: number;
  offset?: number;
};

export async function getRevenueReports(params: RevenueReportParams) {
  const where: Record<string, unknown> = { status: "realized" };
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) (where.createdAt as Record<string, Date>).gte = params.from;
    if (params.to) (where.createdAt as Record<string, Date>).lte = params.to;
  }
  if (params.marketId) where.marketId = params.marketId;
  if (params.revenueType) where.revenueType = params.revenueType;

  const [events, summary] = await Promise.all([
    prisma.platformRevenueEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 100,
      skip: params.offset ?? 0,
    }),
    getRevenueSummary({ from: params.from, to: params.to, marketId: params.marketId }),
  ]);
  return { events, summary };
}
