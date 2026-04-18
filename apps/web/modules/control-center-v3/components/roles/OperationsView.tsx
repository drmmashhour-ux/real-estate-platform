"use client";

import type { CommandCenterRoleView, CompanyCommandCenterV3Shared } from "../../company-command-center-v3.types";
import { BlockerList } from "../shared/BlockerList";
import { PriorityList } from "../shared/PriorityList";
import { RiskList } from "../shared/RiskList";
import { RoleHeroSummary } from "../shared/RoleHeroSummary";
import { RoleSystemCard } from "../shared/RoleSystemCard";
import { RolloutStateChips } from "../shared/RolloutStateChips";

export function OperationsView({
  view,
  shared,
}: {
  view: CommandCenterRoleView;
  shared: CompanyCommandCenterV3Shared;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Operations narrative</h2>
        <div className="mt-2">
          <RoleHeroSummary text={view.heroSummary} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityList title="Execution priorities" items={view.topPriorities} />
        <RiskList title="Coordination risks" items={view.topRisks} />
      </div>

      <BlockerList title="Backlog & blockers" items={view.topBlockers} />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Operator · Platform · Swarm</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {view.systems.highlights.map((h) => (
            <RoleSystemCard key={h.id} label={h.label} status={h.status} oneLiner={h.oneLiner} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rollout context</h3>
        <div className="mt-2">
          <RolloutStateChips summary={shared.rolloutSummary} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Readiness focus</h3>
        <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
          {(view.recommendedFocusAreas.length ? view.recommendedFocusAreas : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      {view.warnings.length > 0 ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Operational warnings</h3>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {view.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
