"use client";

import type { ExpansionReadiness } from "../market-domination.types";

type Props = { readiness: ExpansionReadiness; territoryName: string };

const bandChip: Record<string, string> = {
  NOT_READY: "bg-zinc-800 text-zinc-300",
  EMERGING: "bg-sky-950 text-sky-200",
  READY: "bg-emerald-950 text-emerald-200",
  PRIORITY: "bg-amber-950 text-amber-200",
};

export function ExpansionReadinessCard({ readiness, territoryName }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-white">{territoryName}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${bandChip[readiness.band] ?? bandChip.NOT_READY}`}>
          {readiness.band}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{readiness.score}</p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">Readiness score (0–100)</p>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Strengths</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-300">
            {readiness.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Blockers</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-rose-200/90">
            {readiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 border-t border-white/10 pt-3 text-xs text-zinc-300">{readiness.recommendedEntryStrategy}</p>
    </div>
  );
}
