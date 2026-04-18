"use client";

export function RoiLeadSnapshotCard({ count, hint }: { count: number; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">ROI calculations stored</p>
      <p className="mt-2 text-3xl font-bold text-amber-200">{count}</p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
