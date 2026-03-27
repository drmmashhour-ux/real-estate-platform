"use client";

export type BatchRow = {
  id: string;
  name: string | null;
  status: string;
  listingCount: number;
  createdAt: string;
  completedAt: string | null;
  driftAlertCount: number;
  tuningReviewRecommended: boolean | null;
};

export function CalibrationBatchTable({
  batches,
  onOpen,
  onRun,
  runLoadingId,
}: {
  batches: BatchRow[];
  onOpen: (id: string) => void;
  onRun: (id: string) => void;
  runLoadingId?: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Items</th>
            <th className="px-3 py-2">Drift alerts</th>
            <th className="px-3 py-2">Review?</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/50">
              <td className="px-3 py-2 font-mono text-xs text-zinc-400">{new Date(b.createdAt).toLocaleString()}</td>
              <td className="px-3 py-2 text-zinc-200">{b.name ?? "—"}</td>
              <td className="px-3 py-2 text-xs uppercase text-zinc-400">{b.status}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-300">{b.listingCount}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-300">{b.driftAlertCount}</td>
              <td className="px-3 py-2 text-xs text-zinc-400">{b.tuningReviewRecommended == null ? "—" : b.tuningReviewRecommended ? "yes" : "no"}</td>
              <td className="px-3 py-2 text-right space-x-2">
                {b.status === "draft" || b.status === "failed" ? (
                  <button
                    type="button"
                    disabled={runLoadingId === b.id}
                    onClick={() => onRun(b.id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                  >
                    {runLoadingId === b.id ? "…" : "Run"}
                  </button>
                ) : null}
                <button type="button" onClick={() => onOpen(b.id)} className="text-xs text-amber-400 hover:text-amber-300">
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
