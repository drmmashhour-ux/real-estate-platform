"use client";

export function BriefingSummaryCard({
  periodStart,
  periodEnd,
  status,
}: {
  periodStart: string;
  periodEnd: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs uppercase text-zinc-500">Période</div>
      <div className="text-sm text-zinc-200">
        {periodStart} → {periodEnd}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        Statut: <span className="text-amber-200/90">{status}</span>
      </div>
    </div>
  );
}
