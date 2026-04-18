"use client";

import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function FounderMetricSnapshot({ snapshot }: { snapshot: CompanyMetricsSnapshot }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Dossiers actifs" value={snapshot.deals.active} />
      <MetricCard label="Clos (fenêtre)" value={snapshot.deals.closed} />
      <MetricCard label="Conformité ouverte" value={snapshot.compliance.openCases} />
      <MetricCard label="Blocages doc." value={snapshot.blockers.blockedDealRequests} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
