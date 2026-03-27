"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioMonitoringEventDto, PortfolioMonitoringSummaryDto } from "@/modules/deal-analyzer/domain/contracts";

type WatchlistRow = { id: string; name: string };

type Props = {
  enabled: boolean;
};

export function PortfolioMonitoringPanel({ enabled }: Props) {
  const [watchlists, setWatchlists] = useState<WatchlistRow[] | null>(null);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioMonitoringSummaryDto | null>(null);
  const [events, setEvents] = useState<PortfolioMonitoringEventDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadWatchlists = useCallback(async () => {
    const res = await fetch("/api/deal-analyzer/watchlists", { credentials: "include" });
    if (res.status === 401) {
      setWatchlists([]);
      return;
    }
    if (!res.ok) return;
    const j = (await res.json()) as { watchlists?: WatchlistRow[] };
    const w = j.watchlists ?? [];
    setWatchlists(w);
    if (w.length > 0) setWatchlistId(w[0].id);
  }, []);

  const loadMonitoring = useCallback(async () => {
    if (!watchlistId) return;
    const res = await fetch(`/api/deal-analyzer/portfolio-monitoring/${encodeURIComponent(watchlistId)}`, {
      credentials: "include",
    });
    if (res.status === 404 || res.status === 503) {
      setSummary(null);
      setEvents([]);
      return;
    }
    if (!res.ok) return;
    const j = (await res.json()) as {
      summary?: PortfolioMonitoringSummaryDto | null;
      events?: PortfolioMonitoringEventDto[];
    };
    setSummary(j.summary ?? null);
    setEvents(j.events ?? []);
  }, [watchlistId]);

  useEffect(() => {
    if (!enabled) return;
    void loadWatchlists();
  }, [enabled, loadWatchlists]);

  useEffect(() => {
    if (!enabled || !watchlistId) return;
    void loadMonitoring();
  }, [enabled, watchlistId, loadMonitoring]);

  async function runMonitoring() {
    if (!watchlistId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deal-analyzer/portfolio-monitoring/${encodeURIComponent(watchlistId)}/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not run monitoring");
        return;
      }
      await loadMonitoring();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  if (watchlists && watchlists.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Portfolio monitoring</p>
        <p className="mt-2 text-sm text-slate-400">
          Add listings to a watchlist first — monitoring compares score snapshots across saved properties.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Portfolio monitoring</p>
          <p className="mt-1 text-sm text-slate-500">
            Rules-based watchlist deltas — not performance guarantees. Enterprise-style summary of opportunity shifts.
          </p>
        </div>
        {watchlists && watchlists.length > 1 ? (
          <label className="flex flex-col text-xs text-slate-500">
            Watchlist
            <select
              className="mt-1 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-slate-200"
              value={watchlistId ?? ""}
              onChange={(e) => setWatchlistId(e.target.value)}
            >
              {watchlists.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void runMonitoring()}
        disabled={loading || !watchlistId}
        className="mt-4 rounded-lg border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2 text-sm font-semibold text-[#E8C547] transition hover:bg-[#C9A646]/20 disabled:opacity-50"
      >
        {loading ? "Running…" : "Run portfolio monitoring"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
      {summary ? (
        <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Upgraded:</span> {summary.upgradedCount}
          </p>
          <p>
            <span className="text-slate-500">Downgraded:</span> {summary.downgradedCount}
          </p>
          <p>
            <span className="text-slate-500">Risk up:</span> {summary.trustDroppedCount}
          </p>
          <p>
            <span className="text-slate-500">Repricing flags:</span> {summary.repricingRecommendedCount}
          </p>
          <p className="sm:col-span-2">
            <span className="text-slate-500">Summary confidence:</span> {summary.confidence}
          </p>
          {summary.biggestMovers.length > 0 ? (
            <div className="sm:col-span-2">
              <p className="text-slate-500">Largest score moves (property id · delta)</p>
              <ul className="mt-1 font-mono text-xs text-slate-400">
                {summary.biggestMovers.slice(0, 5).map((m) => (
                  <li key={m.propertyId}>
                    {m.propertyId.slice(0, 8)}… · {m.deltaScore > 0 ? "+" : ""}
                    {m.deltaScore}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {summary.warnings.length > 0 ? (
            <ul className="sm:col-span-2 list-inside list-disc text-xs text-amber-200/80">
              {summary.warnings.map((w) => (
                <li key={w.slice(0, 48)}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          {watchlistId ? "Run monitoring to snapshot changes across your watchlist." : "Loading…"}
        </p>
      )}
      {events.length > 0 ? (
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent events</p>
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            {events.slice(0, 8).map((ev) => (
              <li key={ev.id} className="rounded-lg border border-white/5 bg-black/20 p-2">
                <span className="font-medium text-slate-200">{ev.title}</span>
                <span className="text-slate-500"> · {ev.eventType.replace(/_/g, " ")}</span>
                <p className="mt-0.5 text-slate-500">{ev.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
