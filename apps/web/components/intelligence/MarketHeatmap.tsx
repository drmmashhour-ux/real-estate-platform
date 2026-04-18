"use client";

export type HeatCell = { city: string; score: number; label: string };

export function MarketHeatmap({ cells }: { cells: HeatCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.score));
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cells.map((c) => (
        <div
          key={c.city}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white"
          style={{
            backgroundColor: `rgba(212, 175, 55, ${0.08 + (c.score / max) * 0.35})`,
          }}
        >
          <span className="font-semibold">{c.city}</span>
          <span className="ml-2 text-xs text-slate-400">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
