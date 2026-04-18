import type { CompanyMetricsSnapshot } from "@/modules/company-metrics/company-metrics.types";

export function OwnerBlockersPanel({ metrics }: { metrics: CompanyMetricsSnapshot }) {
  const b = metrics.blockers;
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Blocages</h3>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-300">
        <li>Demandes BLOCKED: {b.blockedDealRequests}</li>
        <li>Financement sans MAJ 14j: {b.dealsStuckFinancing}</li>
        <li>Factures overdue: {b.overdueInvoices}</li>
      </ul>
    </div>
  );
}
