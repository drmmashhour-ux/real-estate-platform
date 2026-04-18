import type { BrokerKpiSnapshot } from "@/modules/broker-kpis/broker-kpis.types";

export function FollowupHealthCard({ kpi }: { kpi: BrokerKpiSnapshot }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Suivi & réponse</h3>
      <dl className="mt-3 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt>Réponse moy. (h)</dt>
          <dd className="font-mono text-amber-100">
            {kpi.lead.avgResponseTimeHours ?? "—"}{" "}
            <span className="text-[10px] text-zinc-600">(n={kpi.lead.responseSampleSize})</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Suivi en retard</dt>
          <dd className="font-mono text-amber-100">{kpi.lead.followUpOverdue}</dd>
        </div>
      </dl>
    </div>
  );
}
