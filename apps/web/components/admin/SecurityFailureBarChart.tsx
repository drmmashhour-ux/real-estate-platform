import type { HourlyCount } from "@/lib/security/security-analytics";

export function SecurityFailureBarChart({ series }: { series: HourlyCount[] }) {
  if (series.length === 0) {
    return <p className="text-xs text-zinc-500">No failed-login samples in this window.</p>;
  }
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div className="flex h-36 items-end gap-px rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-2">
      {series.map((s) => (
        <div
          key={s.t}
          className="min-w-[5px] flex-1 rounded-t bg-emerald-600/35 hover:bg-emerald-500/45"
          style={{ height: `${Math.max(6, (s.count / max) * 100)}%` }}
          title={`${s.t}: ${s.count}`}
        />
      ))}
    </div>
  );
}
