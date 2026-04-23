"use client";

import type { TerritoryTrendPoint } from "../market-domination.service";

type Props = { points: TerritoryTrendPoint[]; title?: string };

/** Minimal bars — synthetic history in v1; replace with warehouse-backed series when ready. */
export function TerritoryTrendChart({
  points,
  title = "Domination trend (illustrative)",
}: Props) {
  if (!points.length) return null;

  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = Math.max(1, max - min);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-4">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{title}</p>
      <div className="mt-3 flex h-28 items-end gap-2">
        {points.map((p) => {
          const h = ((p.score - min) / span) * 100;
          return (
            <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[48px] rounded-t bg-gradient-to-t from-amber-900/40 to-amber-400/70"
                style={{ height: `${12 + (h / 100) * 88}px` }}
                title={`${p.period}: ${p.score}`}
              />
              <span className="text-[9px] text-zinc-500">{p.period}</span>
              <span className="font-mono text-[11px] text-zinc-300">{p.score}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        Synthetic prior points from growth-rate proxy — wire to analytics warehouse when ready.
      </p>
    </div>
  );
}
