"use client";

import Link from "next/link";
import type { CompanyCommandCenterV2Payload } from "../../company-command-center-v2.types";
import { MetricTile } from "../shared/MetricTile";
import { WarningList } from "../shared/WarningList";
import { OpportunityList } from "../shared/OpportunityList";

const OVERALL: Record<
  CompanyCommandCenterV2Payload["executive"]["overallStatus"],
  { label: string; className: string }
> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function ExecutiveTab({ data }: { data: CompanyCommandCenterV2Payload }) {
  const e = data.executive;
  const badge = OVERALL[e.overallStatus];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">Overall status</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex gap-4 text-center text-sm">
          <div>
            <p className="text-2xl font-semibold text-zinc-100">{e.systemsHealthyCount}</p>
            <p className="text-[10px] text-zinc-500">OK / disabled</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-200/90">{e.systemsWarningCount}</p>
            <p className="text-[10px] text-zinc-500">Warning</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-rose-200/90">{e.systemsCriticalCount}</p>
            <p className="text-[10px] text-zinc-500">Critical</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpportunityList items={e.topOpportunities} title="Top opportunities" />
        <div>
          <h3 className="text-xs font-medium text-rose-200/90">Top risks</h3>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {(e.topRisks.length ? e.topRisks : ["—"]).slice(0, 5).map((x) => (
              <li key={x} className="border-b border-zinc-800/50 pb-1">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <WarningList items={e.criticalWarnings} title="Critical / unified warnings" />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rollout (flags)</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {["primarySystems", "shadowSystems", "influenceSystems", "blockedSystems"].map((k) => {
            const arr = e.rolloutSummary[k as keyof typeof e.rolloutSummary];
            return (
              <div key={k} className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-[11px]">
                <span className="text-zinc-500">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                <p className="mt-1 text-zinc-300">{arr.length ? arr.join(", ") : "—"}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick KPIs</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {e.quickKpis.map((k) => (
            <Link key={k.label} href={k.href ?? "#"} className={k.href ? "block hover:opacity-90" : "pointer-events-none"}>
              <MetricTile label={k.label} value={k.value} />
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Use the tabs above for Growth, Ranking, Brain, Swarm, and Rollouts.{" "}
        <Link href="/admin/control-center" className="text-amber-400/90 hover:text-amber-300">
          Open AI Control Center (V1)
        </Link>
      </p>
    </div>
  );
}
