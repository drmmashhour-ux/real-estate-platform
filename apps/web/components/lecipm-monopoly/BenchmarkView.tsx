"use client";

import { BrokerBenchmarkPanel, type BenchmarkBrokerRow } from "./BrokerBenchmarkPanel";

export function BenchmarkView({
  workspaceId,
  initialRows,
}: {
  workspaceId: string;
  initialRows: BenchmarkBrokerRow[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-slate-100">Internal benchmarks</h2>
          <p className="text-xs text-slate-500">
            Comparisons use this workspace only — never other organizations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
        >
          Refresh
        </button>
      </div>
      <BrokerBenchmarkPanel rows={initialRows} />
      <p className="text-[10px] text-slate-600">Workspace: {workspaceId.slice(0, 8)}…</p>
    </section>
  );
}
