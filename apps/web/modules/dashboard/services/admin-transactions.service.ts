import { prisma } from "@/lib/db";

import { hubBucketForPaymentType } from "./revenue-dashboard.service";
import { formatCadCompactFromCents } from "./format-dashboard-currency";

function platformShareCents(row: { platformFeeCents: number | null; amountCents: number }): number {
  if (row.platformFeeCents != null && row.platformFeeCents > 0) return row.platformFeeCents;
  return Math.round(row.amountCents * 0.12);
}

function paymentTypeLabel(type: string): string {
  switch (type) {
    case "booking":
      return "Booking";
    case "lead_unlock":
      return "Lead purchase";
    case "fsbo_publish":
      return "Listing publish";
    case "subscription":
      return "Subscription";
    case "deposit":
      return "Deposit";
    case "closing_fee":
      return "Closing fee";
    default:
      return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function userLabel(email: string | null, name: string | null): string {
  const n = name?.trim();
  if (n) return n.length > 48 ? `${n.slice(0, 45)}…` : n;
  const e = email?.trim();
  if (!e) return "—";
  const at = e.indexOf("@");
  return at > 0 ? e.slice(0, at).slice(0, 36) + (at > 36 ? "…" : "") : e.slice(0, 40);
}

function shortUuid(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export type AdminTransactionRowVm = {
  id: string;
  shortId: string;
  typeLabel: string;
  paymentTypeRaw: string;
  userLabel: string;
  amountGrossDisplay: string;
  amountGrossCents: number;
  platformShareDisplay: string;
  platformShareCents: number;
  status: string;
  statusTone: "success" | "pending" | "failed";
  hubLabel: string;
  hubKey: string;
  dateLabel: string;
  createdAtIso: string;
  bookingId: string | null;
  dealId: string | null;
  listingId: string | null;
  stripeSessionTail: string | null;
  stripePiTail: string | null;
};

export type AdminTransactionsChartPointVm = {
  date: string;
  grossCents: number;
  platformShareCents: number;
};

export type AdminTransactionsStatsVm = {
  grossVolumeTodayDisplay: string;
  platformShareTodayDisplay: string;
  transactions30dPaid: number;
  successRate30dDisplay: string;
  pending30d: number;
};

export type AdminTransactionsPageVm = {
  stats: AdminTransactionsStatsVm;
  chart: AdminTransactionsChartPointVm[];
  rows: AdminTransactionRowVm[];
};

function toneForStatus(status: string): AdminTransactionRowVm["statusTone"] {
  const s = status.toLowerCase();
  if (s === "paid") return "success";
  if (s === "failed") return "failed";
  return "pending";
}

function tailToken(s: string | null | undefined): string | null {
  if (!s || s.length < 8) return s ?? null;
  return `…${s.slice(-8)}`;
}

/** Unified ledger from `platform_payments` (Stripe-settled monetization rows). */
export async function getAdminTransactionsPageVm(options?: {
  /** Table rows limit (max 400). */
  limit?: number;
  /** Days of chart history (max 30). */
  chartDays?: number;
}): Promise<AdminTransactionsPageVm> {
  const take = Math.min(Math.max(options?.limit ?? 200, 1), 400);
  const chartDayCount = Math.min(Math.max(options?.chartDays ?? 14, 7), 30);

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(todayStart.getTime() + 86400000);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);
  const chartStart = new Date(todayStart.getTime() - chartDayCount * 86400000);

  const [tableRows, todaySlice, chartPaid, statusGroups] = await prisma.$transaction([
    prisma.platformPayment.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        paymentType: true,
        amountCents: true,
        platformFeeCents: true,
        status: true,
        bookingId: true,
        dealId: true,
        listingId: true,
        fsboListingId: true,
        stripeSessionId: true,
        stripePaymentIntentId: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: todayStart, lt: tomorrow } },
      select: { amountCents: true, platformFeeCents: true },
    }),
    prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: { gte: chartStart, lt: tomorrow } },
      select: { createdAt: true, amountCents: true, platformFeeCents: true },
    }),
    prisma.platformPayment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  let grossToday = 0;
  let shareToday = 0;
  for (const r of todaySlice) {
    grossToday += r.amountCents;
    shareToday += platformShareCents(r);
  }

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDayGross = new Map<string, number>();
  const byDayShare = new Map<string, number>();
  for (let i = 0; i < chartDayCount; i++) {
    const d = new Date(todayStart.getTime() - (chartDayCount - 1 - i) * 86400000);
    const k = dayKey(d);
    byDayGross.set(k, 0);
    byDayShare.set(k, 0);
  }
  for (const r of chartPaid) {
    const k = dayKey(r.createdAt);
    if (!byDayGross.has(k)) continue;
    byDayGross.set(k, (byDayGross.get(k) ?? 0) + r.amountCents);
    byDayShare.set(k, (byDayShare.get(k) ?? 0) + platformShareCents(r));
  }
  const chart: AdminTransactionsChartPointVm[] = [...byDayGross.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, grossCents]) => ({
      date,
      grossCents,
      platformShareCents: byDayShare.get(date) ?? 0,
    }));

  let paid30 = 0;
  let failed30 = 0;
  let pending30 = 0;
  for (const g of statusGroups) {
    const c = g._count._all;
    const st = g.status.toLowerCase();
    if (st === "paid") paid30 += c;
    else if (st === "failed") failed30 += c;
    else if (st === "pending") pending30 += c;
  }
  const settled = paid30 + failed30;
  const successRate30dDisplay =
    settled > 0 ? `${Math.round((100 * paid30) / settled)}%` : paid30 > 0 ? "100%" : "—";

  const rows: AdminTransactionRowVm[] = tableRows.map((r) => {
    const hub = hubBucketForPaymentType(r.paymentType);
    const share = platformShareCents(r);
    const listingRef = r.listingId ?? r.fsboListingId;
    return {
      id: r.id,
      shortId: shortUuid(r.id),
      typeLabel: paymentTypeLabel(r.paymentType),
      paymentTypeRaw: r.paymentType,
      userLabel: userLabel(r.user.email, r.user.name),
      amountGrossDisplay: formatCadCompactFromCents(r.amountCents),
      amountGrossCents: r.amountCents,
      platformShareDisplay: formatCadCompactFromCents(share),
      platformShareCents: share,
      status: r.status,
      statusTone: toneForStatus(r.status),
      hubLabel: hub.hubLabel,
      hubKey: hub.hubKey,
      dateLabel: r.createdAt.toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAtIso: r.createdAt.toISOString(),
      bookingId: r.bookingId,
      dealId: r.dealId,
      listingId: listingRef,
      stripeSessionTail: tailToken(r.stripeSessionId),
      stripePiTail: tailToken(r.stripePaymentIntentId),
    };
  });

  return {
    stats: {
      grossVolumeTodayDisplay: formatCadCompactFromCents(grossToday),
      platformShareTodayDisplay: formatCadCompactFromCents(shareToday),
      transactions30dPaid: paid30,
      successRate30dDisplay,
      pending30d: pending30,
    },
    chart,
    rows,
  };
}
