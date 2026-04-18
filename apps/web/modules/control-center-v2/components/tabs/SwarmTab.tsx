"use client";

import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { SystemSummaryCard } from "../shared/SystemSummaryCard";
import { OpportunityList } from "../shared/OpportunityList";
import { WarningList } from "../shared/WarningList";
import { MetricTile } from "../shared/MetricTile";

export function SwarmTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const s = data.v1.systems.swarm;
  const ex = data.swarm;
  return (
    <div className="space-y-6">
      <SystemSummaryCard title="Swarm" status={s.status} summary={s.summary} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Enabled" value={s.enabled ? "yes" : "no"} />
        <MetricTile label="Agent slots" value={String(s.agentSlots)} />
        <MetricTile label="Conflicts" value={s.conflictCount != null ? String(s.conflictCount) : "—"} />
        <MetricTile label="Human review" value={s.humanReviewCount != null ? String(s.humanReviewCount) : "—"} />
      </div>
      <p className="text-xs text-zinc-500">
        Negotiation: {s.negotiationEnabled ? "on" : "off"} · Influence: {s.influenceEnabled ? "on" : "off"} · Primary:{" "}
        {s.primaryEnabled ? "on" : "off"}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <OpportunityList items={ex.opportunities} title="Swarm opportunities" />
        <WarningList items={ex.risks} title="Swarm risks" />
      </div>
      <p className="text-[11px] text-zinc-600">
        Full multi-agent cycle is not executed from this dashboard — advisory flags and V1 summary only.
      </p>
    </div>
  );
}
