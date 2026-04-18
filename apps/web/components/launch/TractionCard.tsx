type Props = {
  totalUsers: number;
  to100: { current: number; target: number; complete: boolean };
  to1000: { current: number; target: number; complete: boolean };
};

export function TractionCard({ totalUsers, to100, to1000 }: Props) {
  const pct100 = Math.min(100, Math.round((100 * to100.current) / to100.target));
  const pct1000 = Math.min(100, Math.round((100 * to1000.current) / to1000.target));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">Traction</h2>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">{totalUsers}</p>
      <p className="text-xs text-zinc-500">Registered users (all time, internal count)</p>
      <div className="mt-6 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Progress to 100</span>
            <span>
              {to100.current} / {to100.target}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-800">
            <div className="h-full bg-emerald-500/80" style={{ width: `${pct100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Progress to 1,000</span>
            <span>
              {to1000.current} / {to1000.target}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-800">
            <div className="h-full bg-violet-500/80" style={{ width: `${pct1000}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
