/**
 * DB-backed admin operational reports (deterministic; suitable for AI-style summaries in UI).
 */

import { AdminReportPeriodType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminOverviewStats } from "@/lib/admin/get-admin-overview";
import {
  getPeriodBounds,
  previousPeriod,
  getAdminPeriodMetrics,
  getRevenueSummary,
  getInvoiceSummary,
  getPayoutSummary,
  getCommissionSummary,
  getTaxSummary,
  type PeriodRange,
} from "@/modules/finance/reporting";

export type AdminReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type AdminAiReport = {
  period: AdminReportPeriod;
  generatedAt: string;
  headline: string;
  bullets: string[];
  metrics: {
    totalUsers: number;
    totalBookings: number;
    revenueCents: number;
    listingsGrowthHint: string;
  };
  kpis?: { label: string; value: string }[];
  financeInsights?: string[];
  comparisonNote?: string;
  periodStart?: string;
  periodEnd?: string;
};

function toEnum(p: AdminReportPeriod): AdminReportPeriodType {
  switch (p) {
    case "daily":
      return AdminReportPeriodType.DAILY;
    case "weekly":
      return AdminReportPeriodType.WEEKLY;
    case "monthly":
      return AdminReportPeriodType.MONTHLY;
    case "yearly":
      return AdminReportPeriodType.YEARLY;
    default:
      return AdminReportPeriodType.MONTHLY;
  }
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

function pctChange(cur: number, prev: number): string {
  if (prev <= 0) return cur > 0 ? "new" : "flat";
  const p = ((cur - prev) / prev) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;
}

function buildFinanceInsights(
  cur: Awaited<ReturnType<typeof getAdminPeriodMetrics>>,
  prev: Awaited<ReturnType<typeof getAdminPeriodMetrics>>,
  tax: Awaited<ReturnType<typeof getTaxSummary>>,
  inv: Awaited<ReturnType<typeof getInvoiceSummary>>,
  payout: Awaited<ReturnType<typeof getPayoutSummary>>
): string[] {
  const out: string[] = [];
  if (cur.platformPaymentsPaidCents > (prev.platformPaymentsPaidCents || 0) * 1.4 && cur.platformPaymentsPaidCents > 10_000) {
    out.push(`Revenue uplift vs prior window (${money(cur.platformPaymentsPaidCents)} vs ${money(prev.platformPaymentsPaidCents)}) — confirm no duplicate charges.`);
  }
  if (inv.unpaidCount > 5) {
    out.push(`${inv.unpaidCount} invoices in period still tied to non-paid payment status — follow up collections.`);
  }
  if (payout.hostPayoutsPendingCount > 10) {
    out.push(`${payout.hostPayoutsPendingCount} BNHub host transfers pending release — check disputes / holds.`);
  }
  if (payout.brokerPayoutsPendingCount > 3) {
    out.push(`${payout.brokerPayoutsPendingCount} broker payout batches awaiting approval/payment.`);
  }
  if (cur.platformDisputesOpened + cur.bnhubDisputesOpened > (prev.platformDisputesOpened + prev.bnhubDisputesOpened) * 1.5) {
    out.push("Dispute intake increased vs prior period — review trust & safety queue.");
  }
  if (tax.gstCollectedCents + tax.qstCollectedCents > 0) {
    out.push(
      `GST/QST on invoices (period): ${money(tax.gstCollectedCents)} GST + ${money(tax.qstCollectedCents)} QST (operational remittance view).`
    );
  }
  if (out.length === 0) {
    out.push("No strong anomalies vs prior period in automated checks — still sample ledgers for reconciliation.");
  }
  return out;
}

async function buildReport(period: AdminReportPeriod, range: PeriodRange, prevRange: PeriodRange): Promise<AdminAiReport> {
  const overview = await getAdminOverviewStats();
  const [cur, prev, revenue, invoices, payouts, commissions, tax] = await Promise.all([
    getAdminPeriodMetrics(range),
    getAdminPeriodMetrics(prevRange),
    getRevenueSummary(range),
    getInvoiceSummary(range),
    getPayoutSummary(range),
    getCommissionSummary(range),
    getTaxSummary(range),
  ]);

  const o = overview ?? {
    totalUsers: 0,
    totalBookings: 0,
    revenueCents: 0,
    totalListings: 0,
    activeListings: 0,
    totalDeals: 0,
    openDisputesCount: 0,
  };

  const newListings =
    cur.newListingsCrm + cur.newListingsFsbo + cur.newListingsShortTerm;
  const prevNewListings =
    prev.newListingsCrm + prev.newListingsFsbo + prev.newListingsShortTerm;

  const headline =
    period === "daily"
      ? "Daily operations — throughput, revenue, and risk signals"
      : period === "weekly"
        ? "Weekly trends — supply, demand, and cash movement"
        : period === "monthly"
          ? "Monthly executive snapshot — growth and tax-relevant totals"
          : "Yearly platform summary — revenue, tax, and hub mix";

  const bullets: string[] = [
    `Users (all-time): ${o.totalUsers.toLocaleString()} · Bookings (all-time): ${o.totalBookings.toLocaleString()} · Deals (all-time): ${o.totalDeals.toLocaleString()}`,
    `New listings (period): ${newListings} (CRM ${cur.newListingsCrm}, FSBO ${cur.newListingsFsbo}, BN ${cur.newListingsShortTerm}) vs prior ${prevNewListings} (${pctChange(newListings, prevNewListings)}).`,
    `Active listings (approx): ${cur.activeListingsApprox.toLocaleString()} · Bookings created ${cur.bookingsCreated}, completed ${cur.bookingsCompleted} · Deals created ${cur.dealsCreated}, closed ${cur.dealsClosed}.`,
    `Leads ${cur.leadsCreated} · ImmoContact logs ${cur.immoContactLogsCreated} · Platform disputes opened ${cur.platformDisputesOpened}/${cur.platformDisputesResolved} open/resolved · BN disputes ${cur.bnhubDisputesOpened}/${cur.bnhubDisputesResolved}.`,
    `Platform payments (paid, period): ${money(cur.platformPaymentsPaidCents)} across ${cur.platformPaymentsPaidCount} rows · Prior window ${money(prev.platformPaymentsPaidCents)} (${pctChange(cur.platformPaymentsPaidCents, prev.platformPaymentsPaidCents)}).`,
    `Paid revenue by hub (PlatformPayment): ${Object.entries(revenue.byHubLabel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => `${k} ${money(v)}`)
      .join(" · ") || "n/a"}.`,
    `Commissions (period): gross ${money(commissions.totalGrossCents)} · broker ${money(commissions.totalBrokerCents)} · platform ${money(commissions.totalPlatformCents)}.`,
    `Broker payouts: batches created ${cur.brokerPayoutsCreated}, paid ${cur.brokerPayoutsPaid} · Host payouts released ${cur.hostPayoutsReleased} (completed guest payments in period).`,
  ];

  const financeInsights = buildFinanceInsights(cur, prev, tax, invoices, payouts);

  const kpis: AdminAiReport["kpis"] = [
    { label: "Paid revenue (period)", value: money(cur.platformPaymentsPaidCents) },
    { label: "GST collected (invoices)", value: money(tax.gstCollectedCents) },
    { label: "QST collected (invoices)", value: money(tax.qstCollectedCents) },
    { label: "Taxable base (est.)", value: money(tax.taxableBaseCents) },
    { label: "Open disputes (approx)", value: String(o.openDisputesCount ?? 0) },
  ];

  const comparisonNote = `Prior window ${prevRange.start.toISOString().slice(0, 10)} → ${prevRange.end.toISOString().slice(0, 10)}`;

  const report: AdminAiReport = {
    period,
    generatedAt: new Date().toISOString(),
    headline,
    bullets,
    metrics: {
      totalUsers: o.totalUsers,
      totalBookings: o.totalBookings,
      revenueCents: cur.platformPaymentsPaidCents,
      listingsGrowthHint:
        newListings > prevNewListings ? "Listing intake up vs prior window." : "Listing intake flat or down vs prior window.",
    },
    kpis,
    financeInsights,
    comparisonNote,
    periodStart: range.start.toISOString(),
    periodEnd: range.end.toISOString(),
  };

  return report;
}

async function persistSnapshot(period: AdminReportPeriod, range: PeriodRange, report: AdminAiReport): Promise<void> {
  try {
    await prisma.adminReportSnapshot.upsert({
      where: {
        periodType_periodStart: {
          periodType: toEnum(period),
          periodStart: range.start,
        },
      },
      create: {
        periodType: toEnum(period),
        periodStart: range.start,
        periodEnd: range.end,
        summaryJson: report as unknown as Prisma.InputJsonValue,
      },
      update: {
        periodEnd: range.end,
        summaryJson: report as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
    });
  } catch {
    /* table may not exist until migrated */
  }
}

export async function generateDailyReport(): Promise<AdminAiReport> {
  const range = getPeriodBounds("daily");
  const prev = previousPeriod(range);
  const r = await buildReport("daily", range, prev);
  await persistSnapshot("daily", range, r);
  return r;
}

export async function generateWeeklyReport(): Promise<AdminAiReport> {
  const range = getPeriodBounds("weekly");
  const prev = previousPeriod(range);
  const r = await buildReport("weekly", range, prev);
  await persistSnapshot("weekly", range, r);
  return r;
}

export async function generateMonthlyReport(): Promise<AdminAiReport> {
  const range = getPeriodBounds("monthly");
  const prev = previousPeriod(range);
  const r = await buildReport("monthly", range, prev);
  await persistSnapshot("monthly", range, r);
  return r;
}

export async function generateYearlyReport(): Promise<AdminAiReport> {
  const range = getPeriodBounds("yearly");
  const prev = previousPeriod(range);
  const r = await buildReport("yearly", range, prev);
  await persistSnapshot("yearly", range, r);
  return r;
}

/** Load last cached snapshot for a period type (most recent generatedAt). */
export async function getLatestAdminReportSnapshot(period: AdminReportPeriod): Promise<AdminAiReport | null> {
  try {
    const row = await prisma.adminReportSnapshot.findFirst({
      where: { periodType: toEnum(period) },
      orderBy: { generatedAt: "desc" },
    });
    if (!row?.summaryJson) return null;
    return row.summaryJson as unknown as AdminAiReport;
  } catch {
    return null;
  }
}
