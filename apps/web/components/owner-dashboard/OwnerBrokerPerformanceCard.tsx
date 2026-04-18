import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerBrokerPerformanceCard({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Courtiers — closings (fenêtre)</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {metrics.rankings.topBrokers.slice(0, 6).map((b) => (
          <li key={b.brokerId} className="flex justify-between gap-2 border-b border-amber-950/30 pb-2">
            <span className="truncate text-amber-100/90">{b.brokerName ?? b.brokerId.slice(0, 8)}</span>
            <span className="font-mono text-amber-200/90">{b.closedDeals}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
