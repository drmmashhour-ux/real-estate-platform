import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerRevenueCard({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  const f = metrics.finance;
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Santé revenus (interne)</h3>
      <dl className="mt-4 grid gap-3 text-sm text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt>Part bureau (splits office)</dt>
          <dd className="font-mono text-amber-100">
            {(f.brokerageRevenueOfficeShareCents / 100).toLocaleString("fr-CA", { maximumFractionDigits: 0 })} $
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Factures (fenêtre)</dt>
          <dd className="font-mono text-amber-100">{(f.invoiceTotalCents / 100).toLocaleString("fr-CA")} $</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Paiements courtiers (fenêtre)</dt>
          <dd className="font-mono text-amber-100">{(f.brokerPayoutTotalCents / 100).toLocaleString("fr-CA")} $</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Factures en retard</dt>
          <dd className="font-mono text-amber-200/90">{f.overdueInvoices}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] text-zinc-600">Données opérationnelles — pas des états financiers déposés.</p>
    </div>
  );
}
