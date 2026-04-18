"use client";

export function LeadFunnelCard({
  leadPipeline,
}: {
  leadPipeline?: {
    scope: string;
    byPipeline: Record<string, number>;
    note?: string;
  };
}) {
  const entries = leadPipeline ? Object.entries(leadPipeline.byPipeline) : [];
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">CRM pipeline</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Scope: <span className="text-zinc-400">{leadPipeline?.scope ?? "—"}</span>
        {leadPipeline?.note ? ` — ${leadPipeline.note}` : ""}
      </p>
      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500">No pipeline rows for your role, or empty pipeline.</p>
        ) : (
          entries.map(([status, count]) => (
            <div key={status} className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{status}</span>
                <span className="tabular-nums text-zinc-300">{count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-zinc-800">
                <div
                  className="h-full rounded bg-emerald-600/90"
                  style={{ width: `${Math.min(100, Math.round((100 * count) / max))}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
