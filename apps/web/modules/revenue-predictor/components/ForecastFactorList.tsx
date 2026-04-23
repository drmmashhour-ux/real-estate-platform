"use client";

import type { RevenueExplainability } from "../revenue-predictor.types";

export function ForecastFactorList({ explain }: { explain: RevenueExplainability }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 text-sm">
      <div>
        <p className="text-xs uppercase text-emerald-500">Supporting</p>
        <ul className="mt-2 list-inside list-disc text-zinc-400">
          {explain.factorsIncreasing.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs uppercase text-amber-500">Headwinds</p>
        <ul className="mt-2 list-inside list-disc text-zinc-400">
          {explain.factorsReducing.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2">
        <p className="text-xs uppercase text-zinc-500">Stage / concentration</p>
        <ul className="mt-2 list-inside list-disc text-zinc-400">
          {explain.stageConcentrationRisks.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      {explain.coachingUpliftReason ?
        <div className="md:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-zinc-300">
          {explain.coachingUpliftReason}
        </div>
      : null}
    </div>
  );
}
