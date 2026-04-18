import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";

export type MetricDelta = {
  key: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
};

export function computeMetricDeltas(
  current: CompanyMetricsSnapshot,
  previous: CompanyMetricsSnapshot | null,
): MetricDelta[] {
  if (!previous) return [];
  const rows: MetricDelta[] = [];
  const add = (key: string, cur: number | null, prev: number | null) => {
    if (cur === null || prev === null) {
      rows.push({ key, current: cur, previous: prev, delta: null });
      return;
    }
    rows.push({ key, current: cur, previous: prev, delta: cur - prev });
  };
  add("deals.closed", current.deals.closed, previous.deals.closed);
  add("deals.active", current.deals.active, previous.deals.active);
  add("leads.total", current.leads.totalLeads, previous.leads.totalLeads);
  add("leads.qualified", current.leads.qualifiedLeads, previous.leads.qualifiedLeads);
  add("compliance.open", current.compliance.openCases, previous.compliance.openCases);
  add("blockers.blocked", current.blockers.blockedDealRequests, previous.blockers.blockedDealRequests);
  add("finance.overdue_invoices", current.finance.overdueInvoices, previous.finance.overdueInvoices);
  return rows;
}
