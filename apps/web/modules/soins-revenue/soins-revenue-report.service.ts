import { FAMILY_ADDON_LIST_PRICES } from "./soins-revenue-catalog";
import type {
  FamilySubscriptionRevenueSummaryVm,
  RevenueLedgerEntry,
  RevenueLineCategory,
  ResidenceRevenueBreakdownVm,
  SoinsRevenueSummaryVm,
} from "./soins-revenue.types";

function sumBy<T>(rows: T[], key: (row: T) => number): number {
  return rows.reduce((s, r) => s + key(r), 0);
}

export type RevenueReportPeriod = {
  start: Date;
  end: Date;
};

/** Aggregate ledger lines into executive summary + admin/mobile payloads. */
export function buildSoinsRevenueSummary(
  entries: RevenueLedgerEntry[],
  period: RevenueReportPeriod,
  currency = "CAD",
): SoinsRevenueSummaryVm {
  const inPeriod = entries.filter((e) => e.occurredAt >= period.start && e.occurredAt <= period.end);

  const mrr = estimateMrrFromLedger(inPeriod);
  const msRange = Math.max(1, period.end.getTime() - period.start.getTime());
  const dailyRevenueApprox = Math.round((sumBy(inPeriod, (e) => e.amount) / (msRange / 86400000)) * 100) / 100;

  const byResMap = new Map<string, { label: string; amount: number }>();
  for (const e of inPeriod) {
    if (!e.residenceId) continue;
    const prev = byResMap.get(e.residenceId) ?? { label: e.residenceId, amount: 0 };
    prev.amount += e.amount;
    byResMap.set(e.residenceId, prev);
  }

  const revenueByResidence = [...byResMap.entries()].map(([id, v]) => ({
    residenceId: id,
    label: v.label,
    amount: Math.round(v.amount * 100) / 100,
  }));

  const byCat = new Map<RevenueLineCategory, number>();
  for (const e of inPeriod) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }

  const revenueByCategory = [...byCat.entries()].map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }));

  let familyAddon = 0;
  for (const e of inPeriod) {
    if (e.category === "FAMILY_ADDON") familyAddon += e.amount;
  }

  let overdueTotal = 0;
  for (const e of inPeriod) {
    if (e.serviceType === "OVERDUE_BALANCE") overdueTotal += e.amount;
  }

  return {
    currency,
    mrr,
    dailyRevenueApprox,
    revenueByResidence,
    revenueByCategory,
    revenueByFamilyAddons: Math.round(familyAddon * 100) / 100,
    overdueTotal: Math.round(overdueTotal * 100) / 100,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
  };
}

/** Rough MRR: recurring categories in window annualized to month if period &lt; 30d; else sum recurring. */
function estimateMrrFromLedger(entries: RevenueLedgerEntry[]): number {
  const recurring: RevenueLineCategory[] = [
    "RESIDENCE_SUBSCRIPTION",
    "FAMILY_ADDON",
    "MONITORING",
    "SERVICE_FEE",
  ];
  let s = 0;
  for (const e of entries) {
    if (recurring.includes(e.category)) s += e.amount;
  }
  return Math.round(s * 100) / 100;
}

export function buildResidenceRevenueBreakdown(
  residenceId: string,
  entries: RevenueLedgerEntry[],
  period: RevenueReportPeriod,
): ResidenceRevenueBreakdownVm {
  const slice = entries.filter(
    (e) =>
      e.residenceId === residenceId &&
      e.occurredAt >= period.start &&
      e.occurredAt <= period.end,
  );

  const listingAndSubscriptionFees = sumWhere(slice, (e) =>
    e.category === "RESIDENCE_SUBSCRIPTION" || e.category === "LISTING_FEE" ? e.amount : 0,
  );
  const serviceFees = sumWhere(slice, (e) => (e.category === "SERVICE_FEE" ? e.amount : 0));
  const familyAddonShare = sumWhere(slice, (e) => (e.category === "FAMILY_ADDON" ? e.amount : 0));
  const monitoringShare = sumWhere(slice, (e) => (e.category === "MONITORING" ? e.amount : 0));

  const mrrContribution =
    Math.round((listingAndSubscriptionFees + serviceFees + familyAddonShare + monitoringShare) * 100) / 100;

  return {
    residenceId,
    mrrContribution,
    listingAndSubscriptionFees,
    serviceFees,
    familyAddonShare,
    monitoringShare,
  };
}

function sumWhere(entries: RevenueLedgerEntry[], fn: (e: RevenueLedgerEntry) => number): number {
  return Math.round(entries.reduce((s, e) => s + fn(e), 0) * 100) / 100;
}

/** Family subscription revenue rollup from ledger + optional active count from CRM. */
export function buildFamilySubscriptionRevenueSummary(
  entries: RevenueLedgerEntry[],
  period: RevenueReportPeriod,
  currency = "CAD",
  activeSubscriptionsApprox?: number,
): FamilySubscriptionRevenueSummaryVm {
  const slice = entries.filter(
    (e) =>
      e.category === "FAMILY_ADDON" &&
      e.occurredAt >= period.start &&
      e.occurredAt <= period.end,
  );

  const totalFamilyAddonMrr = Math.round(sumBy(slice, (e) => e.amount) * 100) / 100;

  const byAddon = (Object.keys(FAMILY_ADDON_LIST_PRICES) as Array<keyof typeof FAMILY_ADDON_LIST_PRICES>).map(
    (addon) => ({
      addon,
      mrr: Math.round(
        slice.filter((e) => e.serviceType === addon).reduce((s, e) => s + e.amount, 0) * 100,
      ) / 100,
    }),
  );

  return {
    currency,
    totalFamilyAddonMrr,
    byAddon,
    activeSubscriptionsApprox: activeSubscriptionsApprox ?? slice.length,
  };
}
