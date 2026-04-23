"use client";

import type { CompetitorPressureView } from "../market-domination.types";

type Props = { view: CompetitorPressureView; territoryName: string };

export function CompetitorPressureCard({ view, territoryName }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold text-white">{territoryName}</p>
        <p className="text-sm text-zinc-400">
          Pressure <span className="font-mono text-amber-200">{view.pressureScore.toFixed(1)}</span>
          <span className="text-zinc-600"> /10</span>
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Attack angles</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-200/90">
            {view.attackAngles.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Where they are weaker</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-sky-200/90">
            {view.weaknessZones.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
