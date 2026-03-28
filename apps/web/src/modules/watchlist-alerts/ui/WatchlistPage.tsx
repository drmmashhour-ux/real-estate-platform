"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/tracking";
import { WatchlistCard } from "@/src/modules/watchlist-alerts/ui/WatchlistCard";
import { AlertsCenter } from "@/src/modules/watchlist-alerts/ui/AlertsCenter";
import { WatchlistSummaryCards } from "@/src/modules/watchlist-alerts/ui/WatchlistSummaryCards";
import { WatchlistEmptyState } from "@/src/modules/watchlist-alerts/ui/WatchlistEmptyState";
import { WatchlistFilters, type WatchlistFilterId } from "@/src/modules/watchlist-alerts/ui/WatchlistFilters";
import { WatchlistTopBar } from "@/src/modules/watchlist-alerts/ui/WatchlistTopBar";

type Payload = {
  items: any[];
  alerts: any[];
  summary: any;
};

export function WatchlistPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<WatchlistFilterId>("all");

  const load = async () => {
    const res = await fetch("/api/watchlist", { cache: "no-store" }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    setData(json);
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    track("watchlist_refresh_triggered");
    await fetch("/api/watchlist/refresh", { method: "POST" }).catch(() => null);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    track("watchlist_viewed");
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((i) => i.latestAlert?.status === "unread");
    if (filter === "strong") {
      return items.filter((i) => {
        const r = String(i.listing?.recommendation ?? "").toLowerCase();
        return r.includes("strong") || i.latestAlert?.alertType === "strong_opportunity_detected";
      });
    }
    if (filter === "review") {
      return items.filter((i) => {
        const r = String(i.listing?.recommendation ?? "").toLowerCase();
        return r.includes("review") || i.latestAlert?.alertType === "needs_review_detected";
      });
    }
    return items.filter((i) => i.latestAlert?.severity === "critical" || i.latestAlert?.severity === "warning");
  }, [data?.items, filter]);

  const recentAlerts = (data?.alerts ?? []).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <WatchlistTopBar refreshing={refreshing} onRefresh={refresh} />

        {loading ? <p className="text-sm text-slate-400">Loading watchlist...</p> : null}
        {!loading && data?.summary ? <WatchlistSummaryCards summary={data.summary} /> : null}

        {!loading ? <WatchlistFilters value={filter} onChange={setFilter} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section>
            {!loading && filteredItems.length === 0 ? <WatchlistEmptyState /> : null}
            {!loading && filteredItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredItems.map((item: any) => (
                  <WatchlistCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </section>

          <aside>
            {!loading ? (
              <AlertsCenter alerts={recentAlerts} onChanged={load} title="Recent alerts" />
            ) : null}
            <a href="#alerts" className="mt-3 inline-flex text-sm text-premium-gold hover:underline">
              View full Alerts Center
            </a>
          </aside>
        </div>

        {!loading ? <div id="alerts"><AlertsCenter alerts={data?.alerts ?? []} onChanged={load} /></div> : null}
      </div>
    </main>
  );
}
