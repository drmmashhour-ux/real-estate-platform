import { addDays, subDays } from "date-fns";
import { monolithPrisma } from "@/lib/db";
import type { BookingStatus, Prisma } from "@prisma/client";

const COUNTABLE_BOOKING: BookingStatus[] = ["CONFIRMED", "COMPLETED", "DISPUTED"];

export type AiPerformanceLog = {
  id: string;
  action: string;
  beforeSnapshot: Prisma.JsonValue;
  afterSnapshot: Prisma.JsonValue;
  createdAt: string;
};

function snapshotNum(
  s: Prisma.JsonValue
): { unit: "cents" | "usd"; v: number } | null {
  if (s === null || typeof s !== "object" || Array.isArray(s)) return null;
  const o = s as Record<string, unknown>;
  if (o.source === "bnhub" || o.nightPriceCents != null) {
    const n = o.nightPriceCents;
    if (typeof n === "number") return { unit: "cents", v: n };
  }
  if (o.source === "marketplace" || o.price != null) {
    const p = o.price;
    if (typeof p === "number") return { unit: "usd", v: p };
  }
  return null;
}

export function priceChangeFromLog(log: {
  beforeSnapshot: Prisma.JsonValue;
  afterSnapshot: Prisma.JsonValue;
}): { before: number; after: number; unit: "cents" | "usd" } | null {
  return priceChanged(log.beforeSnapshot, log.afterSnapshot);
}

function priceChanged(
  b: Prisma.JsonValue,
  a: Prisma.JsonValue
): { before: number; after: number; unit: "cents" | "usd" } | null {
  const pb = snapshotNum(b);
  const pa = snapshotNum(a);
  if (!pb || !pa || pb.unit !== pa.unit) return null;
  if (pb.v === pa.v) return null;
  return { before: pb.v, after: pa.v, unit: pb.unit };
}

/**
 * Interprets raw `ai_execution_logs` rows.
 */
export function computeImpact(logs: AiPerformanceLog[]) {
  let priceChanges = 0;
  for (const l of logs) {
    const d = priceChanged(l.beforeSnapshot, l.afterSnapshot);
    if (d) {
      priceChanges += 1;
    } else if (l.action.includes("price_update")) {
      priceChanges += 1;
    }
  }

  return {
    priceChanges,
    /** Placeholder for listing-scoped conversion events when available. */
    conversionHints: 0,
  };
}

function isPriceEventLog(log: AiPerformanceLog): boolean {
  if (log.action.includes("price_update")) return true;
  return priceChanged(log.beforeSnapshot, log.afterSnapshot) != null;
}

const ESTIMATE_WINDOW_DAYS = 30;

export type PerformanceEstimate = {
  firstPriceEventAt: string | null;
  windowDays: number;
  bookingsBefore: number;
  bookingsAfter: number;
  bookingUpliftPct: number | null;
  revenueBeforeCents: number;
  revenueAfterCents: number;
  revenueUpliftPct: number | null;
  disclaimer: string;
};

function toAiLog(row: {
  id: string;
  action: string;
  beforeSnapshot: Prisma.JsonValue;
  afterSnapshot: Prisma.JsonValue;
  createdAt: Date;
}): AiPerformanceLog {
  return {
    id: row.id,
    action: row.action,
    beforeSnapshot: row.beforeSnapshot,
    afterSnapshot: row.afterSnapshot,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function loadListingPerformance(listingId: string, userId: string) {
  const listing = await monolithPrisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true, title: true, listingCode: true },
  });
  if (!listing) {
    return { ok: false as const, status: 403 as const };
  }

  const [rawLogs, totals] = await Promise.all([
    monolithPrisma.aiExecutionLog.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    monolithPrisma.booking.aggregate({
      where: { listingId, status: { in: COUNTABLE_BOOKING } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
  ]);

  const logs: AiPerformanceLog[] = rawLogs.map(toAiLog);
  const impact = computeImpact(logs);

  const revenueCents = totals._sum.totalCents ?? 0;
  const bookings = totals._count._all;

  const chron = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstPrice = chron.find(isPriceEventLog);
  let estimate: PerformanceEstimate | null = null;

  if (firstPrice) {
    const firstAt = new Date(firstPrice.createdAt);
    const now = new Date();
    const beforeFrom = subDays(firstAt, ESTIMATE_WINDOW_DAYS);
    const afterTo = new Date(
      Math.min(addDays(firstAt, ESTIMATE_WINDOW_DAYS).getTime(), now.getTime())
    );

    const [beforeAgg, afterAgg] = await Promise.all([
      monolithPrisma.booking.aggregate({
        where: {
          listingId,
          status: { in: COUNTABLE_BOOKING },
          createdAt: { gte: beforeFrom, lt: firstAt },
        },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
      monolithPrisma.booking.aggregate({
        where: {
          listingId,
          status: { in: COUNTABLE_BOOKING },
          createdAt: { gte: firstAt, lte: afterTo },
        },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
    ]);

    const bookingsBefore = beforeAgg._count._all;
    const bookingsAfter = afterAgg._count._all;
    const revenueBeforeCents = beforeAgg._sum.totalCents ?? 0;
    const revenueAfterCents = afterAgg._sum.totalCents ?? 0;

    const bookingUpliftPct =
      bookingsBefore === 0
        ? bookingsAfter > 0
          ? 100
          : null
        : Math.round(((bookingsAfter - bookingsBefore) / bookingsBefore) * 1000) / 10;

    const revenueUpliftPct =
      revenueBeforeCents === 0
        ? revenueAfterCents > 0
          ? 100
          : null
        : Math.round(
            ((revenueAfterCents - revenueBeforeCents) / revenueBeforeCents) * 1000
          ) / 10;

    estimate = {
      firstPriceEventAt: firstPrice.createdAt,
      windowDays: ESTIMATE_WINDOW_DAYS,
      bookingsBefore,
      bookingsAfter,
      bookingUpliftPct,
      revenueBeforeCents,
      revenueAfterCents,
      revenueUpliftPct,
      disclaimer:
        "Directional estimate: compares confirmed bookings and recorded stay revenue in the 30 days before vs. after your first logged AI price change. Not a controlled experiment.",
    };
  }

  return {
    ok: true as const,
    listing,
    metrics: {
      bookings,
      revenueCents,
      revenueDollars: revenueCents / 100,
    },
    logs,
    impact,
    estimate,
  };
}

