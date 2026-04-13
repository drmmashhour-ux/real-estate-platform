"use client";

export function ValidationRunSummary({
  name,
  description,
  status,
  createdAt,
  completedAt,
  itemCount,
}: {
  name: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  itemCount: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-400/90">Calibration run</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">{name ?? "Untitled run"}</h2>
          {description ? <p className="mt-2 text-sm text-zinc-400">{description}</p> : null}
        </div>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium uppercase text-zinc-300">{status}</span>
      </div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[10px] uppercase text-zinc-500">Items</dt>
          <dd className="font-mono text-zinc-200">{itemCount}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-zinc-500">Created</dt>
          <dd className="text-zinc-300">{new Date(createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-zinc-500">Completed</dt>
          <dd className="text-zinc-300">{completedAt ? new Date(completedAt).toLocaleString() : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
