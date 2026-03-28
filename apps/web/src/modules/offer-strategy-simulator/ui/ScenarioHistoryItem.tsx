"use client";

import type { SavedOfferScenarioDto } from "@/src/modules/offer-strategy-simulator/domain/savedScenario.types";
import { SelectedScenarioBadge } from "@/src/modules/offer-strategy-simulator/ui/SelectedScenarioBadge";

type Props = {
  scenario: SavedOfferScenarioDto;
  compareSelected: boolean;
  onToggleCompare: () => void;
  onSelectPreferred: () => void;
  onRestore: () => void;
  onDelete: () => void;
  busy: boolean;
};

export function ScenarioHistoryItem({
  scenario,
  compareSelected,
  onToggleCompare,
  onSelectPreferred,
  onRestore,
  onDelete,
  busy,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-[#121212] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-100">{scenario.scenarioLabel}</p>
          {scenario.selected ? <SelectedScenarioBadge /> : null}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Saved {new Date(scenario.createdAt).toLocaleString()} · deal {scenario.output.dealImpact.score} · risk{" "}
          {scenario.output.riskImpact.score}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={compareSelected} onChange={onToggleCompare} disabled={busy} />
          Compare
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={onRestore}
          className="rounded-md border border-white/15 px-2 py-1 text-xs text-slate-200 hover:border-premium-gold/50 disabled:opacity-50"
        >
          Restore
        </button>
        <button
          type="button"
          disabled={busy || scenario.selected}
          onClick={onSelectPreferred}
          className="rounded-md border border-emerald-500/30 px-2 py-1 text-xs text-emerald-200/90 disabled:opacity-40"
        >
          Mark preferred
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="rounded-md border border-red-500/25 px-2 py-1 text-xs text-red-300/90 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
