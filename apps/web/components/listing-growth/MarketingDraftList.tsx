"use client";

import type { ListingMarketingDraft } from "@prisma/client";

export function MarketingDraftList({
  listingId,
  drafts,
  onRefresh,
}: {
  listingId: string;
  drafts: unknown[];
  onRefresh: () => Promise<void>;
}) {
  const rows = drafts as ListingMarketingDraft[];

  async function call(draftId: string, action: "approve" | "reject" | "schedule") {
    const res = await fetch(`/api/broker/listings/${listingId}/marketing-drafts/${draftId}/${action}`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) await onRefresh();
  }

  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Brouillons</h3>
      <ul className="mt-3 space-y-3">
        {rows.map((d) => (
          <li key={d.id} className="rounded-lg border border-amber-900/25 bg-black/40 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-amber-100/90">{d.draftType}</span>
              <span className="text-[10px] uppercase text-zinc-500">
                {d.channel} · {d.status}
              </span>
            </div>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">{d.body}</pre>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-emerald-800/50 px-2 py-1 text-[11px] text-emerald-200/90"
                onClick={() => void call(d.id, "approve")}
              >
                Approuver
              </button>
              <button
                type="button"
                className="rounded border border-red-900/50 px-2 py-1 text-[11px] text-red-300/90"
                onClick={() => void call(d.id, "reject")}
              >
                Rejeter
              </button>
              <button
                type="button"
                className="rounded border border-amber-800/50 px-2 py-1 text-[11px] text-amber-200/90"
                onClick={() => void call(d.id, "schedule")}
              >
                Planifier
              </button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="text-sm text-zinc-500">Aucun brouillon — générez depuis ce panneau.</p>
      )}
    </div>
  );
}
