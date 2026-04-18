import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerPipelineCard({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  const d = metrics.deals;
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pipeline résidentiel</h3>
      <dl className="mt-4 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between">
          <dt>Offres acceptées (étendu)</dt>
          <dd className="font-mono text-amber-100">{d.acceptedOffers}</dd>
        </div>
        <div className="flex justify-between">
          <dt>En exécution (étapes)</dt>
          <dd className="font-mono text-amber-100">{d.inExecution}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Nouvelles demandes CRM</dt>
          <dd className="font-mono text-amber-100">{metrics.leads.totalLeads}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Qualifiées / négociation</dt>
          <dd className="font-mono text-amber-100">{metrics.leads.qualifiedLeads}</dd>
        </div>
      </dl>
    </div>
  );
}
