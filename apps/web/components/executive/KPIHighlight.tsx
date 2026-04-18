import { KPI_DEFINITIONS } from "@/modules/kpi/kpi.definitions";
import type { KpiValue } from "@/modules/kpi/kpi.service";

export function KPIHighlight({ kpi }: { kpi: KpiValue }) {
  const label = KPI_DEFINITIONS[kpi.key]?.label ?? kpi.key.replace(/_/g, " ");
  return (
    <div className="rounded-xl border border-ds-gold/25 bg-amber-950/20 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-gold">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{kpi.formatted}</p>
      {kpi.isEstimate ? (
        <p className="mt-2 text-xs font-semibold uppercase text-amber-200/80">Estimate — {kpi.explanation}</p>
      ) : (
        <p className="mt-2 text-sm text-ds-text-secondary">{kpi.explanation}</p>
      )}
    </div>
  );
}
