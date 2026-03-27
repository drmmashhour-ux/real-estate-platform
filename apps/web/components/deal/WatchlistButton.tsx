"use client";

import { useCallback, useEffect, useState } from "react";

type WatchlistRow = {
  id: string;
  name: string;
  itemCount: number;
};

type Props = {
  listingId: string;
  enabled: boolean;
};

export function WatchlistButton({ listingId, enabled }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [lists, setLists] = useState<WatchlistRow[] | null>(null);

  const loadLists = useCallback(async () => {
    const res = await fetch("/api/deal-analyzer/watchlists", { credentials: "include" });
    if (res.status === 401) {
      setMsg("Sign in to use watchlists.");
      return;
    }
    if (!res.ok) return;
    const j = (await res.json()) as { watchlists?: WatchlistRow[] };
    setLists(j.watchlists ?? []);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadLists();
  }, [enabled, loadLists]);

  async function ensureWatchlistId(): Promise<string | null> {
    await loadLists();
    const res = await fetch("/api/deal-analyzer/watchlists", { credentials: "include" });
    if (res.status === 401) return null;
    const j = (await res.json()) as { watchlists?: WatchlistRow[] };
    const w = j.watchlists ?? [];
    if (w.length > 0) return w[0].id;
    const create = await fetch("/api/deal-analyzer/watchlists", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My watchlist" }),
    });
    if (!create.ok) return null;
    const cj = (await create.json()) as { watchlist?: { id: string } };
    return cj.watchlist?.id ?? null;
  }

  async function add() {
    setStatus("loading");
    setMsg(null);
    try {
      const wlId = await ensureWatchlistId();
      if (!wlId) {
        setStatus("err");
        setMsg("Sign in to add to a watchlist.");
        return;
      }
      const res = await fetch(`/api/deal-analyzer/watchlists/${encodeURIComponent(wlId)}/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: listingId }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setStatus("err");
        setMsg(j.error ?? "Could not add");
        return;
      }
      await fetch(`/api/deal-analyzer/watchlists/${encodeURIComponent(wlId)}/evaluate`, {
        method: "POST",
        credentials: "include",
      });
      setStatus("done");
      setMsg("Saved to your watchlist.");
    } catch {
      setStatus("err");
      setMsg("Network error");
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Watchlist</p>
      <p className="mt-1 text-xs text-slate-500">
        Track this listing for rules-based score and risk change alerts (on-demand evaluation).
      </p>
      {lists && lists.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          {lists.length} list{lists.length === 1 ? "" : "s"} — new items use your first list.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void add()}
        disabled={status === "loading"}
        className="mt-3 rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2 text-xs font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/20 disabled:opacity-50"
      >
        {status === "loading" ? "Saving…" : "Add to watchlist"}
      </button>
      {msg ? <p className="mt-2 text-xs text-slate-400">{msg}</p> : null}
    </div>
  );
}
