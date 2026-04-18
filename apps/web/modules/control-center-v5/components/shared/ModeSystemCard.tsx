"use client";

export function ModeSystemCard({
  label,
  status,
  note,
}: {
  label: string;
  status: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-100">{label}</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">{status}</span>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">{note || "—"}</p>
    </div>
  );
}
