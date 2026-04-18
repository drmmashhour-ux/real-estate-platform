"use client";

import type { CommandCenterRoleView, CompanyCommandCenterV3Shared } from "../../company-command-center-v3.types";
import { BlockerList } from "../shared/BlockerList";
import { PriorityList } from "../shared/PriorityList";
import { RiskList } from "../shared/RiskList";
import { RoleHeroSummary } from "../shared/RoleHeroSummary";
import { RoleSystemCard } from "../shared/RoleSystemCard";
import { RolloutStateChips } from "../shared/RolloutStateChips";

export function GrowthView({
  view,
  shared,
}: {
  view: CommandCenterRoleView;
  shared: CompanyCommandCenterV3Shared;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth narrative</h2>
        <div className="mt-2">
          <RoleHeroSummary text={view.heroSummary} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityList title="Growth opportunities" items={view.topPriorities} />
        <RiskList title="Risks & bottlenecks" items={view.topRisks} />
      </div>

      <BlockerList title="Blockers" items={view.topBlockers} />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Growth systems</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {view.systems.highlights.map((h) => (
            <RoleSystemCard key={h.id} label={h.label} status={h.status} oneLiner={h.oneLiner} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rollouts (growth-relevant)</h3>
        <div className="mt-2">
          <RolloutStateChips summary={shared.rolloutSummary} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recommendation clusters</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {(view.recommendedFocusAreas.length ? view.recommendedFocusAreas : ["—"]).map((x, i) => (
            <li key={i} className="rounded border border-zinc-800/50 px-2 py-1">
              {x}
            </li>
          ))}
        </ul>
      </section>

      {view.warnings.length > 0 ? (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Warnings</h3>
          <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
            {view.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
