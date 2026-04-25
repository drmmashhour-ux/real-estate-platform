"use client";

type Row = { strategyKey: string; domain: string; winRate: number | null; usageCount: number; avgClosingTime?: number | null };

type Props = {
  top: Row[];
  title: string;
};

export function TopStrategiesPanel({ top, title }: Props) {
  if (top.length === 0) {
    return <p className="text-sm text-slate-500">No strategy aggregates yet (probabilistic layer needs more data).</p>;
  }
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-slate-400">
        {top.map((r) => (
          <li key={`${r.domain}-${r.strategyKey}`}>
            <span className="text-amber-200/80">{r.strategyKey}</span> <span className="text-slate-600">({r.domain})</span> — win
            proxy {r.winRate != null ? (r.winRate * 100).toFixed(0) + "%" : "n/a"} — uses {r.usageCount}
            {r.avgClosingTime != null && r.avgClosingTime > 0 ? ` — avg close ~${r.avgClosingTime.toFixed(0)}d (where credited)` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
