"use client";

import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { SystemSummaryCard } from "../shared/SystemSummaryCard";
import { OpportunityList } from "../shared/OpportunityList";
import { WarningList } from "../shared/WarningList";
import { MetricTile } from "../shared/MetricTile";

export function GrowthTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const v = data.v1.systems;
  const g = data.growth;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SystemSummaryCard title="Ads V8" status={v.ads.status} summary={v.ads.summary} />
        <SystemSummaryCard title="CRO V8" status={v.cro.status} summary={v.cro.summary} />
        <SystemSummaryCard title="Growth loop" status={v.growthLoop.status} summary={v.growthLoop.summary} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Ads risky run %" value={v.ads.pctRunsRisky != null ? `${v.ads.pctRunsRisky.toFixed(0)}%` : "—"} />
        <MetricTile label="CRO health" value={v.cro.healthScore != null ? String(v.cro.healthScore) : "—"} />
        <MetricTile label="CRO recs" value={v.cro.recommendationCount != null ? String(v.cro.recommendationCount) : "—"} />
        <MetricTile label="Growth proposed" value={v.growthLoop.actionsProposed != null ? String(v.growthLoop.actionsProposed) : "—"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <OpportunityList items={g.opportunities} title="Growth opportunities" />
        <WarningList items={g.risks} title="Growth risks / anomalies" />
      </div>
      <p className="text-[11px] text-zinc-600">
        Ads diagnostics use in-process comparison aggregates when available. CRO uses analysis bundle when enabled.
      </p>
    </div>
  );
}
