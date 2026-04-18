"use client";

export function BriefingKPIBlock({ metrics }: { metrics: Record<string, string | number | null | undefined> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {Object.entries(metrics).map(([k, v]) => (
        <div key={k} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm">
          <div className="text-xs text-zinc-500">{k}</div>
          <div className="text-zinc-100">{String(v ?? "—")}</div>
        </div>
      ))}
    </div>
  );
}
