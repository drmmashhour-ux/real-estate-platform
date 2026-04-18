import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function BottleneckBoard({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Dossiers actifs par statut</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {metrics.rankings.bottlenecksByStage.map((b) => (
          <li key={b.stage} className="flex justify-between gap-2">
            <span>{b.stage}</span>
            <span className="font-mono text-amber-100/90">{b.dealCount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
