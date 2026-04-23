"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SavedRow = {
  id: string;
  title: string;
  searchType: string;
  city: string | null;
  active: boolean;
};

export default function SavedSearchesPage() {
  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/saved-searches/list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { success?: boolean; items?: SavedRow[]; error?: string };
      if (!res.ok) {
        setItems([]);
        setMessage(data.error ?? "Could not load saved searches");
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

  async function createDemoSearch() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/saved-searches/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Laval multi-unit deals (demo)",
          searchType: "listing",
          city: "Laval",
          propertyType: "multi_unit",
          minPriceCents: 20_000_000,
          maxPriceCents: 200_000_000,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Create failed");
        return;
      }
      await load();
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch(savedSearchId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/monitoring/saved-searches/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedSearchId }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; result?: { run: { newResultCount: number } } };
      if (!res.ok) {
        setMessage(
          data.error === "DATA_SOURCE_REQUIRED" ?
            "Set LECIPM_MONITORING_DATA_LAYER=true to run saved searches against inventory."
          : (data.error ?? "Run failed"),
        );
        return;
      }
      const n = data.result?.run?.newResultCount ?? 0;
      setMessage(`Run complete. ${n} new match(es) since last run (see Alert Center if any).`);
      await load();
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Saved searches</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Discovery and diffing only — new matches raise advisory alerts. No auto-commit or execution.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/dashboard/broker/alerts" className="text-[#D4AF37] underline-offset-4 hover:underline">
              Alert Center
            </Link>
            <Link href="/dashboard/broker/watchlist" className="text-[#D4AF37] underline-offset-4 hover:underline">
              Watchlist
            </Link>
            <Link href="/dashboard/broker/buy-box" className="text-[#D4AF37] underline-offset-4 hover:underline">
              Buy box
            </Link>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createDemoSearch()}
          className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          Create demo search
        </button>
      </div>

      {message ? (
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/80">{message}</div>
      ) : null}

      {loading ? <p className="text-sm text-white/50">Loading…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-white/50">No saved searches yet. Create a demo or POST to the create API.</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/50 p-5">
            <div className="text-lg font-semibold text-[#D4AF37]">{item.title}</div>
            <div className="mt-2 text-sm text-white/60">Type: {item.searchType}</div>
            <div className="text-sm text-white/60">City: {item.city ?? "—"}</div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runSearch(item.id)}
              className="mt-4 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              Run search
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
