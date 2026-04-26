import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { FINANCIAL_CONFIG } from "@/config/financial";
import { logFinanceAdminTagged } from "@/lib/server/launch-logger";
import type { FinAdminDomain } from "@prisma/client";

export type GstQstSplit = {
  gst: string;
  qst: string;
  total: string;
  taxExclusive: string;
};

/**
 * Québec GST + QST on a common tax-exclusive base (services / commissions — not property transfer tax).
 */
export function computeGstQstOnTaxableBase(taxExclusive: string): GstQstSplit {
  const base = Number(taxExclusive);
  if (!Number.isFinite(base)) {
    return { gst: "0", qst: "0", total: "0", taxExclusive: "0" };
  }
  const gst = Math.round(base * FINANCIAL_CONFIG.tax.gst.rate * 100) / 100;
  const qst = Math.round(base * FINANCIAL_CONFIG.tax.qst.rate * 100) / 100;
  const total = Math.round((base + gst + qst) * 100) / 100;
  return {
    gst: gst.toFixed(2),
    qst: qst.toFixed(2),
    total: total.toFixed(2),
    taxExclusive: base.toFixed(2),
  };
}

export async function summarizeHubGstQst(params?: { from?: Date; to?: Date }) {
  const from = params?.from ?? new Date(new Date().getFullYear(), 0, 1);
  const to = params?.to ?? new Date();

  const rows = await prisma.complianceFinanceLedgerEntry.findMany({
    where: { effectiveDate: { gte: from, lte: to } },
    select: {
      domain: true,
      entryType: true,
      amount: true,
      gstAmount: true,
      qstAmount: true,
      taxExclusiveAmount: true,
    },
  });

  let gstCollected = 0;
  let qstCollected = 0;
  let gstPaid = 0;
  let qstPaid = 0;

  for (const r of rows) {
    const g = r.gstAmount ? Number(r.gstAmount) : 0;
    const q = r.qstAmount ? Number(r.qstAmount) : 0;
    const amt = Number(r.amount);
    if (r.entryType === "GST" || r.entryType === "COMMISSION" || r.entryType === "INVOICE") {
      if (amt >= 0) {
        gstCollected += g;
        qstCollected += q;
      } else {
        gstPaid += Math.abs(g);
        qstPaid += Math.abs(q);
      }
    }
    if (r.entryType === "QST") {
      if (amt >= 0) qstCollected += q;
      else qstPaid += Math.abs(q);
    }
  }

  const draft = {
    period: { from: from.toISOString(), to: to.toISOString() },
    gstCollected: gstCollected.toFixed(2),
    qstCollected: qstCollected.toFixed(2),
    gstPaid: gstPaid.toFixed(2),
    qstPaid: qstPaid.toFixed(2),
    netGst: (gstCollected - gstPaid).toFixed(2),
    netQst: (qstCollected - qstPaid).toFixed(2),
    registrant: {
      gst: FINANCIAL_CONFIG.tax.gst.number,
      qst: FINANCIAL_CONFIG.tax.qst.number,
    },
  };

  logFinanceAdminTagged.info("gst_qst_summary_generated", { from: draft.period.from, to: draft.period.to });

  return draft;
}

export async function taxableRevenueByDomain(): Promise<Record<FinAdminDomain, string>> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const grouped = await prisma.complianceFinanceLedgerEntry.groupBy({
    by: ["domain"],
    where: {
      effectiveDate: { gte: yearStart },
      entryType: { in: ["INVOICE", "COMMISSION", "PAYMENT"] },
    },
    _sum: { amount: true },
  });
  const out: Record<string, string> = {
    BROKERAGE: "0.00",
    PLATFORM: "0.00",
    INVESTMENT: "0.00",
  };
  for (const g of grouped) {
    out[g.domain] = (g._sum.amount ? Number(g._sum.amount) : 0).toFixed(2);
  }
  return out as Record<FinAdminDomain, string>;
}
