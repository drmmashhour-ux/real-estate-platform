/**
 * Admin finance aggregation — real DB totals for reporting and tax operations views.
 */

import { prisma } from "@/lib/db";

export type PeriodRange = { start: Date; end: Date };

export type AdminPeriodMetrics = {
  newUsers: number;
  newListingsCrm: number;
  newListingsFsbo: number;
  newListingsShortTerm: number;
  activeListingsApprox: number;
  bookingsCreated: number;
  bookingsCompleted: number;
  dealsCreated: number;
  dealsClosed: number;
  leadsCreated: number;
  immoContactLogsCreated: number;
  platformDisputesOpened: number;
  platformDisputesResolved: number;
  bnhubDisputesOpened: number;
  bnhubDisputesResolved: number;
  platformPaymentsPaidCount: number;
  platformPaymentsPaidCents: number;
  brokerPayoutsCreated: number;
  brokerPayoutsPaid: number;
  hostPaymentsCompleted: number;
  hostPayoutsReleased: number;
};

const CLOSED_DEAL = "closed";
const BN_DISPUTE_CLOSED = ["RESOLVED", "REJECTED", "CLOSED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_FULL_REFUND", "RESOLVED_RELOCATION"] as const;

export function previousPeriod(range: PeriodRange): PeriodRange {
  const ms = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime());
  const start = new Date(range.start.getTime() - ms);
  return { start, end };
}

export function getPeriodBounds(
  kind: "daily" | "weekly" | "monthly" | "yearly",
  now = new Date()
): PeriodRange {
  const end = new Date(now);
  const start = new Date(now);
  if (kind === "daily") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (kind === "weekly") {
    const d = start.getDay();
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (kind === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getAdminPeriodMetrics(range: PeriodRange): Promise<AdminPeriodMetrics> {
  const w = { gte: range.start, lte: range.end };

  try {
    const [
      newUsers,
      newListingsCrm,
      newListingsFsbo,
      newListingsShortTerm,
      crmActive,
      fsboActive,
      stActive,
      bookingsCreated,
      bookingsCompleted,
      dealsCreated,
      dealsClosed,
      leadsCreated,
      immoLogs,
      platDispOpen,
      platDispResolved,
      bnDispOpen,
      bnDispResolved,
      platPay,
      brokerPayoutCreated,
      brokerPayoutPaid,
      hostPayCompleted,
      hostReleased,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: w } }),
      prisma.listing.count({ where: { createdAt: w } }),
      prisma.fsboListing.count({ where: { createdAt: w } }),
      prisma.shortTermListing.count({ where: { createdAt: w } }),
      prisma.listing.count({ where: { brokerAccesses: { some: {} } } }),
      prisma.fsboListing.count({ where: { NOT: { status: "DRAFT" } } }),
      prisma.shortTermListing.count({ where: { listingStatus: "PUBLISHED" } }),
      prisma.booking.count({ where: { createdAt: w } }),
      prisma.booking.count({
        where: { status: "COMPLETED", updatedAt: w },
      }),
      prisma.deal.count({ where: { createdAt: w } }),
      prisma.deal.count({ where: { status: CLOSED_DEAL, updatedAt: w } }),
      prisma.lead.count({ where: { createdAt: w } }),
      prisma.immoContactLog.count({ where: { createdAt: w } }),
      prisma.platformLegalDispute.count({ where: { createdAt: w } }),
      prisma.platformLegalDispute.count({
        where: {
          updatedAt: w,
          status: { in: ["RESOLVED", "REJECTED"] },
        },
      }),
      prisma.dispute.count({ where: { createdAt: w } }),
      prisma.dispute.count({
        where: {
          updatedAt: w,
          status: { in: [...BN_DISPUTE_CLOSED] },
        },
      }),
      prisma.platformPayment.aggregate({
        where: { status: "paid", createdAt: w },
        _count: true,
        _sum: { amountCents: true },
      }),
      prisma.brokerPayout.count({
        where: { createdAt: w },
      }),
      prisma.brokerPayout.count({
        where: { paidAt: { gte: range.start, lte: range.end } },
      }),
      prisma.payment.count({
        where: { status: "COMPLETED", updatedAt: w },
      }),
      prisma.payment.count({
        where: { hostPayoutReleasedAt: w },
      }),
    ]);

    return {
      newUsers,
      newListingsCrm,
      newListingsFsbo,
      newListingsShortTerm,
      activeListingsApprox: crmActive + fsboActive + stActive,
      bookingsCreated,
      bookingsCompleted,
      dealsCreated,
      dealsClosed,
      leadsCreated,
      immoContactLogsCreated: immoLogs,
      platformDisputesOpened: platDispOpen,
      platformDisputesResolved: platDispResolved,
      bnhubDisputesOpened: bnDispOpen,
      bnhubDisputesResolved: bnDispResolved,
      platformPaymentsPaidCount: platPay._count ?? 0,
      platformPaymentsPaidCents: platPay._sum.amountCents ?? 0,
      brokerPayoutsCreated: brokerPayoutCreated,
      brokerPayoutsPaid: brokerPayoutPaid,
      hostPaymentsCompleted: hostPayCompleted,
      hostPayoutsReleased: hostReleased,
    };
  } catch {
    return {
      newUsers: 0,
      newListingsCrm: 0,
      newListingsFsbo: 0,
      newListingsShortTerm: 0,
      activeListingsApprox: 0,
      bookingsCreated: 0,
      bookingsCompleted: 0,
      dealsCreated: 0,
      dealsClosed: 0,
      leadsCreated: 0,
      immoContactLogsCreated: 0,
      platformDisputesOpened: 0,
      platformDisputesResolved: 0,
      bnhubDisputesOpened: 0,
      bnhubDisputesResolved: 0,
      platformPaymentsPaidCount: 0,
      platformPaymentsPaidCents: 0,
      brokerPayoutsCreated: 0,
      brokerPayoutsPaid: 0,
      hostPaymentsCompleted: 0,
      hostPayoutsReleased: 0,
    };
  }
}

export type RevenueSummary = {
  totalPaidCents: number;
  byPaymentType: Record<string, number>;
  byHubLabel: Record<string, number>;
};

const PAYMENT_TYPE_HUB: Record<string, string> = {
  booking: "BNHUB",
  fsbo_publish: "Seller",
  subscription: "Subscriptions",
  lead_unlock: "Broker",
  deposit: "Deals / escrow",
  closing_fee: "Deals / closing",
};

export async function getRevenueSummary(range: PeriodRange): Promise<RevenueSummary> {
  const w = { gte: range.start, lte: range.end };
  try {
    const rows = await prisma.platformPayment.findMany({
      where: { status: "paid", createdAt: w },
      select: { amountCents: true, paymentType: true },
    });
    const byPaymentType: Record<string, number> = {};
    const byHubLabel: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      total += r.amountCents;
      byPaymentType[r.paymentType] = (byPaymentType[r.paymentType] ?? 0) + r.amountCents;
      const hub = PAYMENT_TYPE_HUB[r.paymentType] ?? "Other";
      byHubLabel[hub] = (byHubLabel[hub] ?? 0) + r.amountCents;
    }
    return { totalPaidCents: total, byPaymentType, byHubLabel };
  } catch {
    return { totalPaidCents: 0, byPaymentType: {}, byHubLabel: {} };
  }
}

export type InvoiceSummary = {
  count: number;
  totalAmountCents: number;
  subtotalCents: number;
  gstCents: number;
  qstCents: number;
  unpaidCount: number;
};

export async function getInvoiceSummary(range: PeriodRange): Promise<InvoiceSummary> {
  const w = { gte: range.start, lte: range.end };
  try {
    const rows = await prisma.platformInvoice.findMany({
      where: { createdAt: w },
      select: {
        amountCents: true,
        subtotalCents: true,
        gstCents: true,
        qstCents: true,
        totalCents: true,
        payment: { select: { status: true } },
      },
    });
    let totalAmount = 0;
    let subtotal = 0;
    let gst = 0;
    let qst = 0;
    let unpaid = 0;
    for (const r of rows) {
      totalAmount += r.totalCents ?? r.amountCents;
      subtotal += r.subtotalCents ?? 0;
      gst += r.gstCents ?? 0;
      qst += r.qstCents ?? 0;
      if (r.payment?.status !== "paid") unpaid += 1;
    }
    return {
      count: rows.length,
      totalAmountCents: totalAmount,
      subtotalCents: subtotal,
      gstCents: gst,
      qstCents: qst,
      unpaidCount: unpaid,
    };
  } catch {
    return { count: 0, totalAmountCents: 0, subtotalCents: 0, gstCents: 0, qstCents: 0, unpaidCount: 0 };
  }
}

export type PayoutSummary = {
  brokerPayoutsPendingCents: number;
  brokerPayoutsPaidCents: number;
  brokerPayoutsPendingCount: number;
  hostPayoutsPendingCount: number;
};

export async function getPayoutSummary(_range: PeriodRange): Promise<PayoutSummary> {
  try {
    const [pendingAgg, paidAgg, pendingCount, hostPending] = await Promise.all([
      prisma.brokerPayout.aggregate({
        where: { status: { in: ["PENDING", "APPROVED"] } },
        _sum: { totalAmountCents: true },
      }),
      prisma.brokerPayout.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmountCents: true },
      }),
      prisma.brokerPayout.count({ where: { status: { in: ["PENDING", "APPROVED"] } } }),
      prisma.payment.count({
        where: { status: "COMPLETED", hostPayoutReleasedAt: null },
      }),
    ]);
    return {
      brokerPayoutsPendingCents: pendingAgg._sum.totalAmountCents ?? 0,
      brokerPayoutsPaidCents: paidAgg._sum.totalAmountCents ?? 0,
      brokerPayoutsPendingCount: pendingCount,
      hostPayoutsPendingCount: hostPending,
    };
  } catch {
    return {
      brokerPayoutsPendingCents: 0,
      brokerPayoutsPaidCents: 0,
      brokerPayoutsPendingCount: 0,
      hostPayoutsPendingCount: 0,
    };
  }
}

export type CommissionSummary = {
  totalGrossCents: number;
  totalBrokerCents: number;
  totalPlatformCents: number;
  bySource: Record<string, { gross: number; broker: number; platform: number }>;
};

export async function getCommissionSummary(range: PeriodRange): Promise<CommissionSummary> {
  const w = { gte: range.start, lte: range.end };
  try {
    const [rows, brokerRows] = await Promise.all([
      prisma.platformCommissionRecord.findMany({
        where: { createdAt: w },
        select: {
          commissionAmountCents: true,
          partnerShareCents: true,
          platformShareCents: true,
          commissionSource: true,
        },
      }),
      prisma.brokerCommission.findMany({
        where: { createdAt: w },
        select: {
          grossAmountCents: true,
          brokerAmountCents: true,
          platformAmountCents: true,
        },
      }),
    ]);
    let totalGross = 0;
    let totalBroker = 0;
    let totalPlatform = 0;
    const bySource: CommissionSummary["bySource"] = {};
    for (const r of rows) {
      const g =
        r.commissionAmountCents ?? (r.partnerShareCents ?? 0) + (r.platformShareCents ?? 0);
      const b = r.partnerShareCents ?? 0;
      const p = r.platformShareCents ?? 0;
      totalGross += g;
      totalBroker += b;
      totalPlatform += p;
      const src = r.commissionSource ?? "PLATFORM_RECORD";
      if (!bySource[src]) bySource[src] = { gross: 0, broker: 0, platform: 0 };
      bySource[src].gross += g;
      bySource[src].broker += b;
      bySource[src].platform += p;
    }
    if (rows.length === 0 && brokerRows.length > 0) {
      for (const r of brokerRows) {
        totalGross += r.grossAmountCents;
        totalBroker += r.brokerAmountCents;
        totalPlatform += r.platformAmountCents;
        const src = "BROKER_COMMISSION";
        if (!bySource[src]) bySource[src] = { gross: 0, broker: 0, platform: 0 };
        bySource[src].gross += r.grossAmountCents;
        bySource[src].broker += r.brokerAmountCents;
        bySource[src].platform += r.platformAmountCents;
      }
    }
    return {
      totalGrossCents: totalGross,
      totalBrokerCents: totalBroker,
      totalPlatformCents: totalPlatform,
      bySource,
    };
  } catch {
    return { totalGrossCents: 0, totalBrokerCents: 0, totalPlatformCents: 0, bySource: {} };
  }
}

export type TaxSummary = {
  invoiceCount: number;
  gstCollectedCents: number;
  qstCollectedCents: number;
  taxableBaseCents: number;
  byPaymentType: Record<string, { gst: number; qst: number; base: number }>;
};

export async function getTaxSummary(range: PeriodRange): Promise<TaxSummary> {
  const w = { gte: range.start, lte: range.end };
  try {
    const rows = await prisma.platformInvoice.findMany({
      where: { createdAt: w },
      select: {
        gstCents: true,
        qstCents: true,
        subtotalCents: true,
        amountCents: true,
        payment: { select: { paymentType: true } },
      },
    });
    let gst = 0;
    let qst = 0;
    let base = 0;
    const byPaymentType: TaxSummary["byPaymentType"] = {};
    for (const r of rows) {
      const g = r.gstCents ?? 0;
      const q = r.qstCents ?? 0;
      const b = r.subtotalCents ?? Math.max(0, r.amountCents - g - q);
      gst += g;
      qst += q;
      base += b;
      const pt = r.payment?.paymentType ?? "unknown";
      if (!byPaymentType[pt]) byPaymentType[pt] = { gst: 0, qst: 0, base: 0 };
      byPaymentType[pt].gst += g;
      byPaymentType[pt].qst += q;
      byPaymentType[pt].base += b;
    }
    return {
      invoiceCount: rows.length,
      gstCollectedCents: gst,
      qstCollectedCents: qst,
      taxableBaseCents: base,
      byPaymentType,
    };
  } catch {
    return {
      invoiceCount: 0,
      gstCollectedCents: 0,
      qstCollectedCents: 0,
      taxableBaseCents: 0,
      byPaymentType: {},
    };
  }
}
