"use client";

import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { SystemSummaryCard } from "../shared/SystemSummaryCard";
import { OpportunityList } from "../shared/OpportunityList";
import { WarningList } from "../shared/WarningList";
import { MetricTile } from "../shared/MetricTile";

export function BrainTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const b = data.v1.systems.brain;
  const ex = data.brain;
  return (
    <div className="space-y-6">
      <SystemSummaryCard title="Brain V8" status={b.status} summary={b.summary} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Fallback %" value={b.fallbackRatePct != null ? `${b.fallbackRatePct.toFixed(1)}%` : "—"} />
        <MetricTile label="Comparison runs" value={b.comparisonRuns != null ? String(b.comparisonRuns) : "—"} />
        <MetricTile label="Avg overlap" value={b.avgOverlapRate != null ? `${(b.avgOverlapRate * 100).toFixed(1)}%` : "—"} />
        <MetricTile label="Warnings" value={String(b.warningCount)} />
      </div>
      <div className="grid gap-4 text-xs text-zinc-400">
        <p>
          Shadow: {b.shadowObservationEnabled ? "on" : "off"} · Influence: {b.influenceEnabled ? "on" : "off"} · Primary:{" "}
          {b.primaryEnabled ? "on" : "off"}
        </p>
        {b.lastReportAt ? <p className="font-mono text-zinc-500">Last comparison: {b.lastReportAt}</p> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OpportunityList items={ex.opportunities} title="Brain opportunities" />
        <WarningList items={ex.risks} title="Brain risks" />
      </div>
    </div>
  );
}
