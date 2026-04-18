"use client";

import { useEffect, useState } from "react";

export function LegalHubNeedsAttention({ listingId }: { listingId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    Array<{ title: string; detail: string; suggestedNextStep: string; kind: string }>
  >([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/legal/needs-attention?listingId=${encodeURIComponent(listingId)}`, { credentials: "same-origin" })
      .then(async (res) => {
        const j = (await res.json()) as {
          items?: typeof items;
          flags?: { enabled?: boolean };
        };
        if (cancelled) return;
        setItems(Array.isArray(j.items) ? j.items : []);
        setEnabled(Boolean(j.flags?.enabled));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (!listingId || (!loading && (!enabled || items.length === 0))) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-premium-gold/25 bg-[#0B0B0B]/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-premium-gold">Needs attention</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Plain-language reminders from document status — not a ruling on conduct.
          </p>
        </div>
        {loading ? <span className="text-xs text-slate-500">Updating…</span> : null}
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={`${it.kind}:${it.title}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white">{it.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{it.detail}</p>
            <p className="mt-2 text-xs text-premium-gold/90">{it.suggestedNextStep}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
