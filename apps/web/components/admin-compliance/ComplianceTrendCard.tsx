export function ComplianceTrendCard(props: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...props.rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-amber-500/15 bg-gradient-to-b from-zinc-950 to-black p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/80">{props.title}</p>
      <div className="mt-4 space-y-2">
        {props.rows.map((r) => (
          <div key={r.label}>
            <div className="mb-0.5 flex justify-between text-[11px] text-zinc-400">
              <span>{r.label}</span>
              <span className="tabular-nums text-zinc-200">{r.count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-amber-500/70"
                style={{ width: `${Math.min(100, (r.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
