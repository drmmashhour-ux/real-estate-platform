import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerComplianceCard({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  const c = metrics.compliance;
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Conformité</h3>
      <dl className="mt-4 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between">
          <dt>Cas ouverts (périmètre)</dt>
          <dd className="font-mono text-amber-100">{c.openCases}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Nouveaux (fenêtre)</dt>
          <dd className="font-mono text-amber-100">{c.casesOpened}</dd>
        </div>
      </dl>
    </div>
  );
}
