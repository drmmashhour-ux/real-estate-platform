"use client";

import * as React from "react";

import { buildMoatSignals, moatRecommendations } from "@/modules/growth/moat.service";

function strengthPct(n: number): number {
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

export function MoatPanel() {
  const signals = React.useMemo(() => buildMoatSignals(), []);
  const recommendations = React.useMemo(() => moatRecommendations(signals), [signals]);

  return (
    <section className="rounded-xl border border-amber-900/45 bg-amber-950/15 p-4" data-growth-moat-v1>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Moat engine</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Platform defensibility</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Baseline strengths (0–100%) are heuristic; wire CRM and learning counters for measured scores. Advisory only.
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {signals.map((s) => (
          <li key={s.type} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold capitalize text-zinc-200">
                {s.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-mono text-amber-200/90">{strengthPct(s.strength)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-500/70 transition-[width]"
                style={{ width: `${strengthPct(s.strength)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-400">{s.description}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recommendations</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
          {recommendations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
