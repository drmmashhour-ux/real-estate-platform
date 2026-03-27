import type { AccountingEntry } from "@prisma/client";

export type MonthEndSummary = {
  monthLabel: string;
  periodStart: Date;
  periodEnd: Date;
  grossRevenueCents: number;
  revenueGstCents: number;
  revenueQstCents: number;
  totalExpenseCents: number;
  expenseGstCents: number;
  expenseQstCents: number;
  netRevenueCents: number;
  profitEstimateCents: number;
};

function isRevenue(e: AccountingEntry): boolean {
  return e.entryType === "revenue";
}

function isExpense(e: AccountingEntry): boolean {
  return e.entryType === "expense" || e.entryType === "refund";
}

function isCompleted(e: AccountingEntry): boolean {
  return e.status === "completed" || e.status === "reconciled";
}

export function aggregateMonthEnd(entries: AccountingEntry[], year: number, month: number): MonthEndSummary {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let grossRevenueCents = 0;
  let revenueGstCents = 0;
  let revenueQstCents = 0;
  let totalExpenseCents = 0;
  let expenseGstCents = 0;
  let expenseQstCents = 0;

  for (const e of entries) {
    if (!isCompleted(e)) continue;
    const d = e.entryDate;
    if (d < periodStart || d > periodEnd) continue;

    if (isRevenue(e)) {
      grossRevenueCents += e.subtotalCents;
      revenueGstCents += e.gstCents;
      revenueQstCents += e.qstCents;
    } else if (isExpense(e)) {
      totalExpenseCents += Math.abs(e.subtotalCents);
      expenseGstCents += Math.abs(e.gstCents);
      expenseQstCents += Math.abs(e.qstCents);
    }
  }

  const netRevenueCents = grossRevenueCents - totalExpenseCents;
  const profitEstimateCents = netRevenueCents;

  return {
    monthLabel: `${year}-${String(month).padStart(2, "0")}`,
    periodStart,
    periodEnd,
    grossRevenueCents,
    revenueGstCents,
    revenueQstCents,
    totalExpenseCents,
    expenseGstCents,
    expenseQstCents,
    netRevenueCents,
    profitEstimateCents,
  };
}
