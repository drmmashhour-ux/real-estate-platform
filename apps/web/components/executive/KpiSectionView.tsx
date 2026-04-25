"use client";

import { Card } from "@/components/ui/Card";
import type { KpiSection } from "@/modules/executive-reporting/executive-report.types";

function Row({ label, value, trace }: { label: string; value: string; trace: string }) {
  return (
    <div className="border-b border-zinc-200 py-2 last:border-0">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-sm font-medium text-zinc-800">{label}</span>
        <span className="text-sm tabular-nums text-zinc-900">{value}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{trace}</p>
    </div>
  );
}

export function KpiSectionView({ kpi }: { kpi: KpiSection }) {
  const pct = (v: number | null) => (v == null ? "n/a" : `${(v * 100).toFixed(1)}%`);

  return (
    <Card variant="dashboardPanel" className="space-y-2">
      <h3 className="text-base font-semibold text-[#0B0B0B]">KPI</h3>
      <p className="text-xs text-zinc-500">
        UTC window: {kpi.range.startUtc} → {kpi.range.endUtcExclusive}
      </p>
      <div>
        <Row
          label="Leads created"
          value={kpi.leadsCreated.value == null ? "n/a" : String(kpi.leadsCreated.value)}
          trace={`Tables: ${kpi.leadsCreated.trace.tables.join(", ")} — ${kpi.leadsCreated.trace.description}`}
        />
        <Row
          label="Pipeline deals opened"
          value={kpi.pipelineDealsCreated.value == null ? "n/a" : String(kpi.pipelineDealsCreated.value)}
          trace={`Tables: ${kpi.pipelineDealsCreated.trace.tables.join(", ")} — ${kpi.pipelineDealsCreated.trace.description}`}
        />
        <Row
          label="Pipeline deals closed (period)"
          value={kpi.pipelineDealsClosedInPeriod.value == null ? "n/a" : String(kpi.pipelineDealsClosedInPeriod.value)}
          trace={`Tables: ${kpi.pipelineDealsClosedInPeriod.trace.tables.join(", ")} — ${kpi.pipelineDealsClosedInPeriod.trace.description}`}
        />
        <Row
          label="Committee favorable ratio"
          value={pct(kpi.committeeFavorableRate.value)}
          trace={`Tables: ${kpi.committeeFavorableRate.trace.tables.join(", ")} — ${kpi.committeeFavorableRate.trace.description}`}
        />
        <Row
          label="Pipeline capital sum (active stacks)"
          value={kpi.pipelineCapitalRequiredSum.value == null ? "n/a" : kpi.pipelineCapitalRequiredSum.value.toFixed(2)}
          trace={`Tables: ${kpi.pipelineCapitalRequiredSum.trace.tables.join(", ")} — ${kpi.pipelineCapitalRequiredSum.trace.description}`}
        />
        <Row
          label="Avg close cycle (days)"
          value={kpi.avgPipelineCloseCycleDays.value == null ? "n/a" : String(kpi.avgPipelineCloseCycleDays.value)}
          trace={`Tables: ${kpi.avgPipelineCloseCycleDays.trace.tables.join(", ")} — ${kpi.avgPipelineCloseCycleDays.trace.description}`}
        />
        <Row
          label="Lead contacted-or-beyond rate"
          value={pct(kpi.leadContactedOrBeyondRate.value)}
          trace={`Tables: ${kpi.leadContactedOrBeyondRate.trace.tables.join(", ")} — ${kpi.leadContactedOrBeyondRate.trace.description}`}
        />
        <Row
          label="Lead won (among created) rate"
          value={pct(kpi.leadWonAmongCreatedRate.value)}
          trace={`Tables: ${kpi.leadWonAmongCreatedRate.trace.tables.join(", ")} — ${kpi.leadWonAmongCreatedRate.trace.description}`}
        />
      </div>
      {kpi.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
          {kpi.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
