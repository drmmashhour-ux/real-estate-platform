"use client";

import type { CommandCenterRoleView, CompanyCommandCenterV3Shared } from "../../company-command-center-v3.types";
import { BlockerList } from "../shared/BlockerList";
import { ExecutiveMetricRow } from "../shared/ExecutiveMetricRow";
import { PriorityList } from "../shared/PriorityList";
import { RiskList } from "../shared/RiskList";
import { RoleHeroSummary } from "../shared/RoleHeroSummary";
import { RoleSystemCard } from "../shared/RoleSystemCard";
import { RolloutStateChips } from "../shared/RolloutStateChips";

const OVERALL: Record<CompanyCommandCenterV3Shared["overallStatus"], { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-emerald-950/80 text-emerald-100" },
  limited: { label: "Limited", className: "bg-amber-950/80 text-amber-100" },
  warning: { label: "Warning", className: "bg-orange-950/80 text-orange-100" },
  critical: { label: "Critical", className: "bg-rose-950/90 text-rose-50" },
};

export function FounderView({
  view,
  shared,
}: {
  view: CommandCenterRoleView;
  shared: CompanyCommandCenterV3Shared;
}) {
  const badge = OVERALL[shared.overallStatus];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">Company posture</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <ExecutiveMetricRow items={shared.quickKpis.slice(0, 6)} />
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Strategic narrative</h2>
        <div className="mt-2">
          <RoleHeroSummary text={view.heroSummary} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityList title="Top opportunities" items={view.topPriorities} />
        <RiskList title="Top risks" items={view.topRisks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BlockerList title="Biggest blockers" items={view.topBlockers} />
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Watch now</h3>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {(view.warnings.length ? view.warnings : ["—"]).map((w, i) => (
              <li key={i} className="rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1">
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Systems needing attention</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {view.systems.highlights.length
            ? view.systems.highlights.map((h) => (
                <RoleSystemCard key={h.id} label={h.label} status={h.status} oneLiner={h.oneLiner} />
              ))
            : (
                <p className="text-xs text-zinc-500">No subsystem flagged warning/critical/limited.</p>
              )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rollout summary</h3>
        <div className="mt-2">
          <RolloutStateChips summary={view.rolloutSummary} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Focus areas</h3>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
          {(view.recommendedFocusAreas.length ? view.recommendedFocusAreas : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
