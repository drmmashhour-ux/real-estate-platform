type Row = { metric: string; value: number | string | null; timeframe: string; source: string };

export function InvestorMetricsCard({ rows }: { rows: Row[] }) {
  const preview = rows.slice(0, 8);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Investor metrics (lineage)</h2>
      <p className="mt-1 text-xs text-zinc-500">Each row names its source table or env key — export JSON for diligence.</p>
      <ul className="mt-4 space-y-2 text-xs">
        {preview.map((r) => (
          <li key={r.metric} className="flex flex-col gap-0.5 border-b border-zinc-800/60 pb-2 text-zinc-300">
            <span className="font-medium text-zinc-200">{r.metric}</span>
            <span className="tabular-nums text-emerald-200/90">{String(r.value)}</span>
            <span className="text-zinc-600">
              {r.timeframe} · {r.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
