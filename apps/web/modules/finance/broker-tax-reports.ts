/**
 * Broker earnings summaries for admin tax preparation support (not filed T-slips).
 */

import { InvoiceIssuer } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PeriodRange } from "./reporting";

export type BrokerEarningsSummary = {
  brokerId: string;
  period: { start: string; end: string };
  grossCommissionsCents: number;
  brokerNetCents: number;
  platformShareCents: number;
  payoutPaidCents: number;
  payoutPendingCents: number;
  invoiceCount: number;
};

export async function getBrokerEarningsSummary(brokerId: string, range: PeriodRange): Promise<BrokerEarningsSummary | null> {
  try {
    const broker = await prisma.user.findFirst({
      where: { id: brokerId, role: "BROKER" },
      select: { id: true },
    });
    if (!broker) return null;

    const [commissions, payoutsPaid, payoutsPending] = await Promise.all([
      prisma.brokerCommission.findMany({
        where: { brokerId, createdAt: { gte: range.start, lte: range.end } },
        select: { grossAmountCents: true, brokerAmountCents: true, platformAmountCents: true },
      }),
      prisma.brokerPayout.aggregate({
        where: {
          brokerId,
          status: "PAID",
          paidAt: { gte: range.start, lte: range.end },
        },
        _sum: { totalAmountCents: true },
      }),
      prisma.brokerPayout.aggregate({
        where: { brokerId, status: { in: ["PENDING", "APPROVED"] } },
        _sum: { totalAmountCents: true },
      }),
    ]);

    let gross = 0;
    let brokerNet = 0;
    let platform = 0;
    for (const c of commissions) {
      gross += c.grossAmountCents;
      brokerNet += c.brokerAmountCents;
      platform += c.platformAmountCents;
    }

    const invCount = await prisma.platformInvoice.count({
      where: {
        userId: brokerId,
        invoiceIssuer: InvoiceIssuer.BROKER,
        createdAt: { gte: range.start, lte: range.end },
      },
    });

    return {
      brokerId,
      period: { start: range.start.toISOString(), end: range.end.toISOString() },
      grossCommissionsCents: gross,
      brokerNetCents: brokerNet,
      platformShareCents: platform,
      payoutPaidCents: payoutsPaid._sum.totalAmountCents ?? 0,
      payoutPendingCents: payoutsPending._sum.totalAmountCents ?? 0,
      invoiceCount: invCount,
    };
  } catch {
    return null;
  }
}

export type BrokerTaxSlipYearData = {
  brokerId: string;
  year: number;
  /** Sum of broker-side earnings from commission rows in year */
  totalReportableCommissionsCents: number;
  /** Payout batches marked paid in year */
  totalPayoutsRecordedCents: number;
  months: { month: number; commissionsCents: number; payoutsCents: number }[];
};

export async function generateBrokerTaxSlipData(brokerId: string, year: number): Promise<BrokerTaxSlipYearData | null> {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const range: PeriodRange = { start, end };

  const summary = await getBrokerEarningsSummary(brokerId, range);
  if (!summary) return null;

  const months: BrokerTaxSlipYearData["months"] = [];
  for (let m = 0; m < 12; m++) {
    const ms = new Date(year, m, 1);
    const me = new Date(year, m + 1, 0, 23, 59, 59, 999);
    const [cAgg, pAgg] = await Promise.all([
      prisma.brokerCommission.aggregate({
        where: { brokerId, createdAt: { gte: ms, lte: me } },
        _sum: { brokerAmountCents: true },
      }),
      prisma.brokerPayout.aggregate({
        where: {
          brokerId,
          status: "PAID",
          paidAt: { gte: ms, lte: me },
        },
        _sum: { totalAmountCents: true },
      }),
    ]);
    months.push({
      month: m + 1,
      commissionsCents: cAgg._sum.brokerAmountCents ?? 0,
      payoutsCents: pAgg._sum.totalAmountCents ?? 0,
    });
  }

  const payoutsYear = await prisma.brokerPayout.aggregate({
    where: {
      brokerId,
      status: "PAID",
      paidAt: { gte: start, lte: end },
    },
    _sum: { totalAmountCents: true },
  });

  return {
    brokerId,
    year,
    totalReportableCommissionsCents: summary.brokerNetCents,
    totalPayoutsRecordedCents: payoutsYear._sum.totalAmountCents ?? 0,
    months,
  };
}
