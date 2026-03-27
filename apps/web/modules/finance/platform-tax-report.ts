/**
 * Platform-side revenue, tax collected, and net income estimates for admin (operational — not a filed return).
 */

import { prisma } from "@/lib/db";
import type { PeriodRange } from "./reporting";
import { getRevenueSummary, getTaxSummary, type RevenueSummary, type TaxSummary } from "./reporting";

export type PlatformIncomeSummary = {
  grossPlatformPaymentsCents: number;
  revenueByHub: RevenueSummary["byHubLabel"];
  tax: TaxSummary;
};

export async function getPlatformIncomeSummary(period: PeriodRange): Promise<PlatformIncomeSummary> {
  const rev = await getRevenueSummary(period);
  const tax = await getTaxSummary(period);
  return {
    grossPlatformPaymentsCents: rev.totalPaidCents,
    revenueByHub: rev.byHubLabel,
    tax,
  };
}

export type TaxableRevenueSummary = {
  taxableBaseCents: number;
  gstCents: number;
  qstCents: number;
  totalWithTaxCents: number;
};

export async function getTaxableRevenueSummary(period: PeriodRange): Promise<TaxableRevenueSummary> {
  const t = await getTaxSummary(period);
  return {
    taxableBaseCents: t.taxableBaseCents,
    gstCents: t.gstCollectedCents,
    qstCents: t.qstCollectedCents,
    totalWithTaxCents: t.taxableBaseCents + t.gstCollectedCents + t.qstCollectedCents,
  };
}

export type ExpenseSummary = {
  stripeFeesCents: number;
  /** Placeholder when no expense ledger exists */
  note: string;
};

export async function getExpenseSummary(period: PeriodRange): Promise<ExpenseSummary> {
  try {
    const agg = await prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: { gte: period.start, lte: period.end } },
      _sum: { stripeFeeCents: true },
    });
    return {
      stripeFeesCents: agg._sum.stripeFeeCents ?? 0,
      note: "General operating expenses are tracked outside this rollup unless posted to platform ledgers.",
    };
  } catch {
    return { stripeFeesCents: 0, note: "Expense aggregation unavailable." };
  }
}

export type NetPlatformIncomeEstimate = {
  grossRevenueCents: number;
  estimatedStripeCostsCents: number;
  estimatedNetBeforeTaxCents: number;
  disclaimer: string;
};

export async function getNetPlatformIncomeEstimate(period: PeriodRange): Promise<NetPlatformIncomeEstimate> {
  const [rev, exp] = await Promise.all([getRevenueSummary(period), getExpenseSummary(period)]);
  const gross = rev.totalPaidCents;
  const costs = exp.stripeFeesCents;
  return {
    grossRevenueCents: gross,
    estimatedStripeCostsCents: costs,
    estimatedNetBeforeTaxCents: Math.max(0, gross - costs),
    disclaimer:
      "Rough operational estimate only — does not include payroll, rent, or other GL expenses. Requires accountant review.",
  };
}
