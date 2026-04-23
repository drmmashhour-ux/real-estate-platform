"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  watchType: string;
  referenceId: string;
  title: string | null;
  city: string | null;
  currentScore: number | null;
  lastPriceCents: number | null;
  createdAt: string;
};

export default function MonitoringWatchlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/watchlist/list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { success?: boolean; items?: Item[]; error?: string };
      if (!res.ok) {
        setItems([]);
        setMessage(data.error ?? "Could not load watchlist");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/watchlist/remove", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Remove failed");
        return;
      }
      await load();
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function runChecks() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/watchlist/run-checks", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Checks failed");
        return;
      }
      setMessage("Checks completed. See Alert Center for any new advisory items.");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Watchlist</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Bookmarks for listings, deal metrics, buy-box rows, and neighborhoods. Tracking only — no automatic offers or
            purchases.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/dashboard/broker/alerts" className="text-[#D4AF37] underline-offset-4 hover:underline">
              Alert Center
            </Link>
            <Link href="/dashboard/broker/saved-searches" className="text-[#D4AF37] underline-offset-4 hover:underline">
              Saved searches
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runChecks()}
            className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Run price / score checks
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Refresh
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/80">{message}</div>
      ) : null}

      {loading ? <p className="text-sm text-white/50">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-white/50">No bookmarks yet. Add from deal finder, buy box, or your APIs.</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/50 p-5">
            <div className="text-lg font-semibold text-[#D4AF37]">{item.title ?? item.referenceId}</div>
            <div className="mt-2 text-sm text-white/60">Type: {item.watchType}</div>
            <div className="text-sm text-white/60">Reference: {item.referenceId}</div>
            <div className="text-sm text-white/60">City: {item.city ?? "—"}</div>
            <div className="text-sm text-white/60">Score: {item.currentScore ?? "—"}</div>
            <div className="text-sm text-white/60">
              Last price (cents): {item.lastPriceCents != null ? item.lastPriceCents : "—"}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove(item.id)}
              className="mt-4 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
