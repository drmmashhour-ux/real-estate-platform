import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerKPIBar({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  const m = metrics;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-amber-900/40 bg-black/55 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Inscriptions actives</p>
        <p className="mt-1 font-mono text-2xl text-amber-50">{m.listings.totalActiveResidential}</p>
      </div>
      <div className="rounded-xl border border-amber-900/40 bg-black/55 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Dossiers actifs</p>
        <p className="mt-1 font-mono text-2xl text-amber-50">{m.deals.active}</p>
      </div>
      <div className="rounded-xl border border-amber-900/40 bg-black/55 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Closings (fenêtre)</p>
        <p className="mt-1 font-mono text-2xl text-amber-50">{m.deals.closed}</p>
      </div>
      <div className="rounded-xl border border-amber-900/40 bg-black/55 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Volume brut comm.</p>
        <p className="mt-1 font-mono text-2xl text-amber-50">
          {(m.finance.totalCommissionVolumeCents / 100).toLocaleString("fr-CA", { maximumFractionDigits: 0 })} $
        </p>
      </div>
    </div>
  );
}
