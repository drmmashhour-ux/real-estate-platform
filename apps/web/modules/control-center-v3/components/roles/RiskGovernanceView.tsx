"use client";

import type { CommandCenterRoleView, CompanyCommandCenterV3Shared } from "../../company-command-center-v3.types";
import { BlockerList } from "../shared/BlockerList";
import { PriorityList } from "../shared/PriorityList";
import { RiskList } from "../shared/RiskList";
import { RoleHeroSummary } from "../shared/RoleHeroSummary";
import { RoleSystemCard } from "../shared/RoleSystemCard";
import { RolloutStateChips } from "../shared/RolloutStateChips";

export function RiskGovernanceView({
  view,
  shared,
}: {
  view: CommandCenterRoleView;
  shared: CompanyCommandCenterV3Shared;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Governance narrative</h2>
        <div className="mt-2">
          <RoleHeroSummary text={view.heroSummary} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityList title="Governance priorities" items={view.topPriorities} />
        <RiskList title="Risk signals" items={view.topRisks} />
      </div>

      <BlockerList title="Rollout / policy blockers" items={view.topBlockers} />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Systems under review</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {view.systems.highlights.map((h) => (
            <RoleSystemCard key={h.id} label={h.label} status={h.status} oneLiner={h.oneLiner} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rollout posture</h3>
        <div className="mt-2">
          <RolloutStateChips summary={shared.rolloutSummary} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Caution areas</h3>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
          {(view.recommendedFocusAreas.length ? view.recommendedFocusAreas : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Warnings</h3>
        <ul className="mt-2 space-y-1 text-xs text-rose-200/80">
          {(view.warnings.length ? view.warnings : ["—"]).map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
