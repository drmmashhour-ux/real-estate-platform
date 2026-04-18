export function BlockedClosingsPanel({ count }: { count: number }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        count > 0 ? "border-orange-500/35 bg-orange-950/15" : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Closing readiness risk</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-100">{count}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Open internal cases typed as closing readiness risk. Verify against real closing dates in deal workspace.
      </p>
    </div>
  );
}
