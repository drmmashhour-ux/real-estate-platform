/**
 * Internal accounting summaries — not government filings. Verify with a CPA.
 */
import { prisma } from "@/lib/db";

export type BrokerTaxSummaryResult = {
  disclaimer: string;
  brokerId: string;
  year: number;
  totals: {
    grossCommissionsCents: number;
    platformCommissionsCents: number;
    expensesCents: number;
    gstOnExpensesCents: number;
    qstOnExpensesCents: number;
    netBrokerIncomeEstimateCents: number;
    lostTransactionCostsCents: number;
    lostTransactionCount: number;
  };
  byMonth: Record<string, { revenueCents: number; expensesCents: number }>;
  byExpenseCategory: Record<string, number>;
};

export async function buildBrokerTaxSummary(brokerId: string, year: number): Promise<BrokerTaxSummaryResult> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const records = await prisma.brokerTransactionRecord.findMany({
    where: { brokerId, createdAt: { gte: start, lt: end } },
  });

  const expenses = await prisma.brokerExpense.findMany({
    where: { brokerId, expenseDate: { gte: start, lt: end } },
  });

  let grossCommissionsCents = 0;
  let platformCommissionsCents = 0;
  let lostCosts = 0;
  let lostCount = 0;

  for (const r of records) {
    grossCommissionsCents += r.brokerCommissionCents;
    platformCommissionsCents += r.platformCommissionCents;
    if (r.outcome === "lost") {
      lostCount += 1;
      lostCosts += r.expensesCents;
    }
  }

  let expTotal = 0;
  let gstExp = 0;
  let qstExp = 0;
  const byCat: Record<string, number> = {};
  const byMonth: Record<string, { revenueCents: number; expensesCents: number }> = {};

  for (const e of expenses) {
    expTotal += e.amountCents;
    gstExp += e.taxGstCents;
    qstExp += e.taxQstCents;
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amountCents;
    const key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { revenueCents: 0, expensesCents: 0 };
    byMonth[key].expensesCents += e.amountCents;
  }

  for (const r of records) {
    if (r.outcome !== "won") continue;
    const key = r.closedAt
      ? `${r.closedAt.getFullYear()}-${String(r.closedAt.getMonth() + 1).padStart(2, "0")}`
      : `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { revenueCents: 0, expensesCents: 0 };
    byMonth[key].revenueCents += r.brokerCommissionCents;
  }

  const netEstimate = grossCommissionsCents - platformCommissionsCents - expTotal - gstExp - qstExp;

  return {
    disclaimer:
      "Internal tax summary only — verify with a qualified accountant. Not a government filing.",
    brokerId,
    year,
    totals: {
      grossCommissionsCents,
      platformCommissionsCents,
      expensesCents: expTotal,
      gstOnExpensesCents: gstExp,
      qstOnExpensesCents: qstExp,
      netBrokerIncomeEstimateCents: netEstimate,
      lostTransactionCostsCents: lostCosts,
      lostTransactionCount: lostCount,
    },
    byMonth,
    byExpenseCategory: byCat,
  };
}

export type PlatformTaxSummaryResult = {
  disclaimer: string;
  from: string;
  to: string;
  totals: {
    taxableRevenueCents: number;
    gstCollectedCents: number;
    qstCollectedCents: number;
    paymentCount: number;
  };
  byPaymentType: Record<string, { count: number; amountCents: number; gstCents: number; qstCents: number }>;
  byMonth: Record<string, { amountCents: number; gstCents: number; qstCents: number }>;
};

function extractTaxFromJson(json: unknown): { gst: number; qst: number } {
  if (!json || typeof json !== "object") return { gst: 0, qst: 0 };
  const o = json as Record<string, unknown>;
  const lines = o.lines;
  if (Array.isArray(lines)) {
    let gst = 0;
    let qst = 0;
    for (const line of lines) {
      if (line && typeof line === "object") {
        const L = line as Record<string, unknown>;
        if (L.party === "PLATFORM") {
          gst += Number(L.gstCents ?? 0);
          qst += Number(L.qstCents ?? 0);
        }
      }
    }
    return { gst, qst };
  }
  const gst = Number(o.gstCents ?? o.combinedGstCents ?? 0);
  const qst = Number(o.qstCents ?? o.combinedQstCents ?? 0);
  return { gst, qst };
}

export async function buildPlatformTaxSummary(from: Date, to: Date): Promise<PlatformTaxSummaryResult> {
  const payments = await prisma.platformPayment.findMany({
    where: {
      status: "paid",
      createdAt: { gte: from, lte: to },
    },
  });

  let taxable = 0;
  let gst = 0;
  let qst = 0;
  const byType: PlatformTaxSummaryResult["byPaymentType"] = {};
  const byMonth: PlatformTaxSummaryResult["byMonth"] = {};

  for (const p of payments) {
    const amt = p.amountCents ?? 0;
    taxable += amt;
    const tax = extractTaxFromJson(p.taxCalculationJson);
    gst += tax.gst;
    qst += tax.qst;

    const pt = p.paymentType;
    if (!byType[pt]) byType[pt] = { count: 0, amountCents: 0, gstCents: 0, qstCents: 0 };
    byType[pt].count += 1;
    byType[pt].amountCents += amt;
    byType[pt].gstCents += tax.gst;
    byType[pt].qstCents += tax.qst;

    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { amountCents: 0, gstCents: 0, qstCents: 0 };
    byMonth[key].amountCents += amt;
    byMonth[key].gstCents += tax.gst;
    byMonth[key].qstCents += tax.qst;
  }

  return {
    disclaimer:
      "Internal accounting summary only — not final tax filing software. Verify with a qualified accountant.",
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      taxableRevenueCents: taxable,
      gstCollectedCents: gst,
      qstCollectedCents: qst,
      paymentCount: payments.length,
    },
    byPaymentType: byType,
    byMonth,
  };
}
