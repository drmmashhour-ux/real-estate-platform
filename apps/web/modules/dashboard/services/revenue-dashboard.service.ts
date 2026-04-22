import { prisma } from "@/lib/db";

import type { RevenueDashboardData } from "../view-models";

import { formatCadCompactFromCents } from "./format-dashboard-currency";

/** Map internal payment types → admin “hub” bucket for executive reporting. */
export function hubBucketForPaymentType(paymentType: string): { hubKey: string; hubLabel: string } {
  switch (paymentType) {
    case "booking":
      return { hubKey: "bnhub", hubLabel: "BNHub" };
    case "lead_unlock":
      return { hubKey: "broker", hubLabel: "Broker Hub" };
    case "fsbo_publish":
      return { hubKey: "seller", hubLabel: "Seller Hub" };
    case "featured_listing":
    case "listing_contact_lead":
      return { hubKey: "listings", hubLabel: "Listings" };
    case "subscription":
      return { hubKey: "buyer", hubLabel: "Buyer Hub" };
    case "soins_residence":
    case "soins_family":
      return { hubKey: "residence", hubLabel: "Soins Hub" };
    case "deposit":
    case "closing_fee":
      return { hubKey: "investor", hubLabel: "Investor Hub" };
    default:
      return { hubKey: "platform", hubLabel: "Platform" };
  }
}

function platformShareCents(row: { platformFeeCents: number | null; amountCents: number }): number {
  if (row.platformFeeCents != null && row.platformFeeCents > 0) return row.platformFeeCents;
  return Math.round(row.amountCents * 0.12);
}

export function startOfUtcDayFromDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcDay(d: Date): Date {
  return startOfUtcDayFromDate(d);
}

export async function getRevenueDashboardData(): Promise<RevenueDashboardData> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrow = new Date(todayStart.getTime() + 86400000);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const last7Start = new Date(todayStart.getTime() - 7 * 86400000);
  const seriesStart = new Date(todayStart.getTime() - 13 * 86400000);

  const [todayRows, yesterdayRows, seriesRows, avgRows] = await Promise.all([
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: todayStart, lt: tomorrow } },
      select: { paymentType: true, platformFeeCents: true, amountCents: true, createdAt: true },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: yesterdayStart, lt: todayStart } },
      select: { paymentType: true, platformFeeCents: true, amountCents: true },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: seriesStart, lt: tomorrow } },
      select: { platformFeeCents: true, amountCents: true, createdAt: true },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: last7Start, lt: tomorrow } },
      select: { platformFeeCents: true, amountCents: true },
    }),
  ]);

  const sumCents = (rows: typeof todayRows) =>
    rows.reduce((s, r) => s + platformShareCents(r), 0);

  const todayRevenueCents = sumCents(todayRows);
  const sevenDaySum = avgRows.reduce((s, r) => s + platformShareCents(r), 0);
  const sevenDayAverageCents = Math.round(sevenDaySum / 7);

  const hubAgg = new Map<string, { label: string; cents: number }>();
  for (const row of todayRows) {
    const { hubKey, hubLabel } = hubBucketForPaymentType(row.paymentType);
    const prev = hubAgg.get(hubKey) ?? { label: hubLabel, cents: 0 };
    prev.cents += platformShareCents(row);
    hubAgg.set(hubKey, prev);
  }

  const yesterdayHub = new Map<string, number>();
  for (const row of yesterdayRows) {
    const { hubKey } = hubBucketForPaymentType(row.paymentType);
    yesterdayHub.set(hubKey, (yesterdayHub.get(hubKey) ?? 0) + platformShareCents(row));
  }

  let highestHubLabel = "—";
  let highest = -1;
  for (const [, v] of hubAgg) {
    if (v.cents > highest) {
      highest = v.cents;
      highestHubLabel = v.label;
    }
  }
  if (hubAgg.size === 0) highestHubLabel = "—";

  const revenueByHub = [...hubAgg.entries()].map(([hubKey, v]) => {
    const prior = yesterdayHub.get(hubKey) ?? 0;
    let deltaPct: number | null = null;
    if (prior > 0) deltaPct = Math.round(((v.cents - prior) / prior) * 1000) / 10;
    else if (v.cents > 0) deltaPct = 100;
    return {
      hubKey,
      hubLabel: v.label,
      amountCents: v.cents,
      deltaPctVsPriorDay: deltaPct,
    };
  });

  revenueByHub.sort((a, b) => b.amountCents - a.amountCents);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = new Map<string, number>();
  for (const row of seriesRows) {
    const k = dayKey(row.createdAt);
    byDay.set(k, (byDay.get(k) ?? 0) + platformShareCents(row));
  }

  const series: RevenueDashboardData["series"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 86400000);
    const k = dayKey(d);
    series.push({ date: k, revenueCents: byDay.get(k) ?? 0 });
  }

  return {
    todayRevenueCents,
    sevenDayAverageCents,
    highestHubLabel,
    transactions: todayRows.length,
    revenueByHub,
    series,
  };
}

/** Human-readable stub for charts — callers can replace with chart library input. */
export function revenueDashboardSummaryLine(data: RevenueDashboardData): string {
  return `Today ${formatCadCompactFromCents(data.todayRevenueCents)} · ${data.transactions} tx · top ${data.highestHubLabel}`;
}
