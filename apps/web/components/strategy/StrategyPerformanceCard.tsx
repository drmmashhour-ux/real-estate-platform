"use client";

type Perf = { winRate: number | null; usageCount: number; avgClosingTime: number | null; confidenceLevel: string };

type Props = {
  title?: string;
  strategyKey: string;
  domain: string;
  initial?: Perf | null;
};

export function StrategyPerformanceCard({ title = "Strategy performance (aggregate)", strategyKey, domain, initial = null }: Props) {
  const p = initial;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
      <h3 className="font-medium text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {strategyKey} · {domain} — descriptive only, not a prediction of your next result.
      </p>
      {p ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          <li>Win-rate proxy: {p.winRate != null ? (p.winRate * 100).toFixed(1) + "%" : "n/a (insufficient data)"}</li>
          <li>Logged uses: {p.usageCount}</li>
          <li>Confidence band: {p.confidenceLevel}</li>
          <li>Avg. closing time (where credited): {p.avgClosingTime != null ? p.avgClosingTime.toFixed(1) + " d" : "n/a"}</li>
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Load a strategy key in the full dashboard, or use the deal-level panel.</p>
      )}
    </div>
  );
}
