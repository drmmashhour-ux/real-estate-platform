"use client";

export function BoardMetricRow({ metrics }: { metrics: Record<string, string> }) {
  const entries = Object.entries(metrics);
  if (!entries.length) {
    return <p className="text-xs text-zinc-500">No KPI metrics in snapshot.</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
          <p className="text-[10px] font-medium uppercase text-zinc-500">{k}</p>
          <p className="mt-0.5 text-sm text-zinc-200">{v}</p>
        </div>
      ))}
    </div>
  );
}
