/**
 * Aggregates platform money movement for the Admin Management Hub:
 * monetization streams (PlatformPayment) + ledger-style events (PlatformRevenueEvent by entity type).
 */

import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfUtcDay, startOfUtcIsoWeekMonday, startOfUtcMonth } from "@/lib/datetime/utc-calendar-windows";
import {
  addBookingPlatformFeesToStreams,
  foldPaidPlatformPaymentsIntoStreams,
  type StreamBreakdownCents,
} from "@/lib/admin/management-hub-payment-streams";

export type { StreamBreakdownCents } from "@/lib/admin/management-hub-payment-streams";

export type MoneyWindowKey = "day" | "week" | "month";

export type ManagementHubMoneySnapshot = {
  /** Calendar windows in UTC: today, ISO week from Monday, month from 1st. */
  windows: {
    key: MoneyWindowKey;
    label: string;
    reportHint: string;
    streams: StreamBreakdownCents;
    /** Platform revenue events (realized) grouped by `entity_type` — complements checkout streams. */
    byEntityTypeCents: Record<string, number>;
    entityTypeTotalCents: number;
  }[];
  generatedAt: string;
};

/**
 * Streams from checkout (`PlatformPayment`) for custom windows; reuses categorization from platform-payment-breakdown.
 */
async function aggregatePlatformPaymentStreams(from: Date, to: Date): Promise<StreamBreakdownCents> {
  const rows = await prisma.platformPayment.findMany({
    where: {
      status: "paid",
      createdAt: { gte: from, lte: to },
    },
    select: { paymentType: true, amountCents: true },
  });

  const base = foldPaidPlatformPaymentsIntoStreams(rows);
  const feeAgg = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.COMPLETED,
      platformFeeCents: { not: null },
      updatedAt: { gte: from, lte: to },
    },
    _sum: { platformFeeCents: true },
  });
  const bookingFees = feeAgg._sum.platformFeeCents ?? 0;
  return addBookingPlatformFeesToStreams(base, bookingFees);
}

async function sumEntityTypes(from: Date, to: Date): Promise<{ byEntity: Record<string, number>; total: number }> {
  const groups = await prisma.platformRevenueEvent.groupBy({
    by: ["entityType"],
    where: {
      status: "realized",
      createdAt: { gte: from, lte: to },
    },
    _sum: { amountCents: true },
  });
  const byEntity: Record<string, number> = {};
  let total = 0;
  for (const g of groups) {
    const c = g._sum.amountCents ?? 0;
    byEntity[g.entityType] = c;
    total += c;
  }
  return { byEntity, total };
}

export async function getManagementHubMoneySnapshot(): Promise<ManagementHubMoneySnapshot> {
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const weekStart = startOfUtcIsoWeekMonday(now);
  const monthStart = startOfUtcMonth(now);

  const [dStreams, wStreams, mStreams, dEnt, wEnt, mEnt] = await Promise.all([
    aggregatePlatformPaymentStreams(dayStart, now),
    aggregatePlatformPaymentStreams(weekStart, now),
    aggregatePlatformPaymentStreams(monthStart, now),
    sumEntityTypes(dayStart, now),
    sumEntityTypes(weekStart, now),
    sumEntityTypes(monthStart, now),
  ]);

  const windows: ManagementHubMoneySnapshot["windows"] = [
    {
      key: "day",
      label: "Daily (today, UTC)",
      reportHint: "Compare with `/admin/reports/daily` for narrative KPI export.",
      streams: dStreams,
      byEntityTypeCents: dEnt.byEntity,
      entityTypeTotalCents: dEnt.total,
    },
    {
      key: "week",
      label: "Weekly (this ISO week, Mon UTC → now)",
      reportHint: "Calendar week — see also `/admin/reports/weekly` for narrative trends.",
      streams: wStreams,
      byEntityTypeCents: wEnt.byEntity,
      entityTypeTotalCents: wEnt.total,
    },
    {
      key: "month",
      label: "Monthly (this calendar month, UTC)",
      reportHint: "From the 1st of the month — see `/admin/reports/monthly` for executive snapshot.",
      streams: mStreams,
      byEntityTypeCents: mEnt.byEntity,
      entityTypeTotalCents: mEnt.total,
    },
  ];

  return { windows, generatedAt: now.toISOString() };
}
