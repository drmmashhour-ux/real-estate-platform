import type { GrowthBrainSnapshot } from "../growth-brain.types";

type Props = { snapshot: GrowthBrainSnapshot };

export function GrowthBrainSummaryBar({ snapshot }: Props) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Signals</p>
        <p className="text-2xl font-semibold text-white">{snapshot.signals.length}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Opportunities</p>
        <p className="text-2xl font-semibold text-amber-200">{snapshot.opportunities.length}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Actions</p>
        <p className="text-2xl font-semibold text-sky-200">{snapshot.actions.length}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Autonomy</p>
        <p className="text-lg font-semibold text-violet-200">{snapshot.autonomy}</p>
      </div>
    </div>
  );
}
