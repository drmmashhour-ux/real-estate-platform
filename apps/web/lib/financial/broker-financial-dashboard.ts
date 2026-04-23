import { prisma } from "@/lib/db";
import { RevenueParty } from "@prisma/client";

function maskTaxNumber(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.replace(/\s/g, "");
  if (s.length <= 4) return "****";
  return `****${s.slice(-4)}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short", year: "numeric" });
}

function humanizeCategory(cat: string): string {
  return cat
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export type BrokerTransactionsPayload = {
  summary: {
    totalRevenueCents: number;
    transactionCount: number;
    commissionsPaidCents: number;
    commissionsPendingCents: number;
  };
  monthlyTrend: { month: string; revenue: number }[];
  revenueBreakdown: { name: string; value: number }[];
  transactions: { id: string; createdAt: string; category: string; amountCents: number }[];
  insights: { headline: string; body: string };
};

export async function getBrokerTransactionsPayload(brokerUserId: string): Promise<BrokerTransactionsPayload> {
  const ledgerRows = await prisma.partyRevenueLedgerEntry.findMany({
    where: { brokerId: brokerUserId, party: RevenueParty.BROKER },
    orderBy: { createdAt: "desc" },
    take: 800,
    select: { id: true, amountCents: true, category: true, createdAt: true },
  });

  const commissions = await prisma.brokerCommission.findMany({
    where: { brokerId: brokerUserId },
    select: { brokerAmountCents: true, status: true, createdAt: true, id: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const useLedger = ledgerRows.length > 0;

  const monthMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  let totalRevenueCents = 0;

  if (useLedger) {
    for (const e of ledgerRows) {
      totalRevenueCents += e.amountCents;
      const ym = e.createdAt.toISOString().slice(0, 7);
      monthMap.set(ym, (monthMap.get(ym) ?? 0) + e.amountCents);
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amountCents);
    }
  } else {
    for (const c of commissions) {
      totalRevenueCents += c.brokerAmountCents;
      const ym = c.createdAt.toISOString().slice(0, 7);
      monthMap.set(ym, (monthMap.get(ym) ?? 0) + c.brokerAmountCents);
      const bucket = c.status === "paid" ? "paid_commissions" : "pending_commissions";
      categoryMap.set(bucket, (categoryMap.get(bucket) ?? 0) + c.brokerAmountCents);
    }
  }

  const sortedMonths = Array.from(monthMap.keys()).sort();
  const last12 = sortedMonths.slice(-12);
  const monthlyTrend = last12.map((ym) => ({
    month: monthLabel(ym),
    revenue: Math.round((monthMap.get(ym) ?? 0) / 100),
  }));

  const revenueBreakdown = Array.from(categoryMap.entries())
    .map(([name, cents]) => ({
      name: humanizeCategory(name),
      value: Math.max(0, Math.round(cents / 100)),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  let commissionsPaidCents = 0;
  let commissionsPendingCents = 0;
  for (const c of commissions) {
    if (c.status === "paid") commissionsPaidCents += c.brokerAmountCents;
    else commissionsPendingCents += c.brokerAmountCents;
  }

  const transactions = useLedger
    ? ledgerRows.slice(0, 50).map((e) => ({
        id: e.id,
        createdAt: e.createdAt.toISOString(),
        category: e.category,
        amountCents: e.amountCents,
      }))
    : commissions.slice(0, 50).map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        category: `commission_${c.status}`,
        amountCents: c.brokerAmountCents,
      }));

  const insights = buildInsights(monthlyTrend, revenueBreakdown);

  return {
    summary: {
      totalRevenueCents,
      transactionCount: useLedger ? ledgerRows.length : commissions.length,
      commissionsPaidCents,
      commissionsPendingCents,
    },
    monthlyTrend,
    revenueBreakdown,
    transactions,
    insights,
  };
}

function buildInsights(
  monthlyTrend: { month: string; revenue: number }[],
  revenueBreakdown: { name: string; value: number }[],
): { headline: string; body: string } {
  if (monthlyTrend.length === 0) {
    return {
      headline: "No broker revenue rows yet",
      body: "When platform payments attribute revenue to your brokerage, trends and breakdowns appear here. Commission records also feed this view when ledger rows are absent.",
    };
  }

  let headline = `Trailing ${monthlyTrend.length}-month revenue visible`;
  if (monthlyTrend.length >= 2) {
    const last = monthlyTrend[monthlyTrend.length - 1]!.revenue;
    const prev = monthlyTrend[monthlyTrend.length - 2]!.revenue;
    if (prev > 0) {
      const pct = Math.round(((last - prev) / prev) * 100);
      headline =
        pct >= 0 ? `Revenue up about ${pct}% vs prior month (CAD)` : `Revenue down about ${Math.abs(pct)}% vs prior month (CAD)`;
    }
  }

  const top = revenueBreakdown[0];
  const body = top
    ? `Largest category: ${top.name}. Use Appraisal Hub for valuation support and pricing analysis — insights here stay operational, not tax advice.`
    : "Use Appraisal Hub for valuation support and pricing analysis. Connect detailed AI commentary in a later iteration.";

  return { headline, body };
}

export type BrokerTaxesPayload = {
  province: string;
  gstMasked: string | null;
  qstMasked: string | null;
  registrationStatus: string | null;
  reporting: { frequency: string; nextReturnDue: string | null; note: string };
};

export async function getBrokerTaxesPayload(brokerUserId: string): Promise<BrokerTaxesPayload> {
  const reg = await prisma.brokerTaxRegistration.findUnique({
    where: { userId: brokerUserId },
    select: {
      province: true,
      gstNumber: true,
      qstNumber: true,
      status: true,
    },
  });

  return {
    province: reg?.province ?? "QC",
    gstMasked: maskTaxNumber(reg?.gstNumber),
    qstMasked: maskTaxNumber(reg?.qstNumber),
    registrationStatus: reg?.status ?? null,
    reporting: {
      frequency: "Annual",
      nextReturnDue: null,
      note: "Due dates depend on your Revenu Québec filing calendar — confirm with your accountant.",
    },
  };
}
