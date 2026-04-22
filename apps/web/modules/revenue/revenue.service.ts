/**
 * Facade over `RevenueEvent` + existing ledger helper — additive; does not replace Stripe or PlatformPayment.
 */

import { prisma } from "@/lib/db";
import { type RevenueEventType, recordRevenueEventLedger } from "@/modules/revenue/revenue-event.service";

export type RevenueSummaryRange = {
  from: Date;
  /** Exclusive upper bound */
  to: Date;
};

export type GetRevenueSummaryResult = {
  totalAmount: number;
  eventCount: number;
  /** Sum of `amount` (CAD) keyed by `event_type` string */
  byType: Record<string, number>;
};

/**
 * Persist a user-centric revenue row (amount stored as dollars in DB, same as `recordRevenueEventLedger`).
 */
export async function recordRevenueEvent(input: {
  type: RevenueEventType;
  amountCents: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordRevenueEventLedger(input);
}

/**
 * Aggregate revenue in a time range (UTC boundaries recommended).
 */
export async function getRevenueSummary(range: RevenueSummaryRange): Promise<GetRevenueSummaryResult> {
  const rows = await prisma.revenueEvent.findMany({
    where: {
      createdAt: { gte: range.from, lt: range.to },
      amount: { gt: 0 },
    },
    select: { eventType: true, amount: true },
  });

  let totalAmount = 0;
  let eventCount = 0;
  const byType: Record<string, number> = {};

  for (const r of rows) {
    const a = Number(r.amount);
    if (!Number.isFinite(a) || a <= 0) continue;
    totalAmount += a;
    eventCount += 1;
    const t = r.eventType || "other";
    byType[t] = (byType[t] ?? 0) + a;
  }

  return { totalAmount, eventCount, byType };
}

export { aggregateLecipmMonetizationMetrics } from "./revenue-aggregation.service";
