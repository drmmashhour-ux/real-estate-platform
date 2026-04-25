"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AlertExplanationCard from "@/components/alerts/AlertExplanationCard";

type WatchlistAlertRow = {
  id: string;
  title: string;
  message: string;
  severity: string;
  alertType: string;
  status: string;
  createdAt: string;
  listing?: { id: string; title: string; city: string } | null;
};

type AnalysisRow = {
  summary?: string | null;
  whyItMatters?: string | null;
  suggestedActions?: unknown;
  riskFlags?: unknown;
  assumptions?: unknown;
  confidence?: number | null;
} | null;

type MonitoringAlertRow = {
  id: string;
  title: string;
  message: string;
  severity: string;
  alertType: string;
  read: boolean;
  createdAt: string;
};

export default function AlertCenterPage() {
  const [tab, setTab] = useState<"watchlist" | "monitoring">("watchlist");
  const [items, setItems] = useState<WatchlistAlertRow[]>([]);
  const [monitoringItems, setMonitoringItems] = useState<MonitoringAlertRow[]>([]);
  const [analysisById, setAnalysisById] = useState<Record<string, AnalysisRow>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async (alertId: string) => {
    const res = await fetch(`/api/monitoring/alerts/analysis?alertId=${encodeURIComponent(alertId)}`, {
      credentials: "include",
    });
    const j = (await res.json()) as { success?: boolean; item?: AnalysisRow };
    if (res.ok && j.success) {
      setAnalysisById((prev) => ({ ...prev, [alertId]: j.item ?? null }));
    }
  }, []);

  const loadMonitoring = useCallback(async () => {
    setLoadingMonitoring(true);
    try {
      const res = await fetch("/api/monitoring/alerts/list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { success?: boolean; items?: MonitoringAlertRow[]; error?: string };
      if (res.ok && data.success) {
        setMonitoringItems(data.items ?? []);
      } else {
        setMonitoringItems([]);
      }
    } catch {
      setMonitoringItems([]);
    } finally {
      setLoadingMonitoring(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist/alerts", { credentials: "include" });
      const data = (await res.json()) as { alerts?: WatchlistAlertRow[]; error?: string };
      if (!res.ok) {
        setItems([]);
        setError(data.error ?? "Failed to load alerts");
        return;
      }
      const alerts = data.alerts ?? [];
      setItems(alerts);
      await Promise.all(
        alerts.map(async (a) => {
          const r = await fetch(`/api/monitoring/alerts/analysis?alertId=${encodeURIComponent(a.id)}`, {
            credentials: "include",
          });
          const j = (await r.json()) as { item?: AnalysisRow };
          if (r.ok) {
            setAnalysisById((prev) => ({ ...prev, [a.id]: j.item ?? null }));
          }
        }),
      );
    } catch {
      setError("Network error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "monitoring") void loadMonitoring();
  }, [tab, loadMonitoring]);

  const generateBrief = useCallback(
    async (alertId: string) => {
      setBusyId(alertId);
      setError(null);
      try {
        const res = await fetch("/api/monitoring/alerts/analyze", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        });
        const j = (await res.json()) as { success?: boolean; item?: AnalysisRow; error?: string };
        if (!res.ok || !j.success) {
          setError(j.error ?? "Analysis failed");
          return;
        }
        setAnalysisById((prev) => ({ ...prev, [alertId]: j.item ?? null }));
      } catch {
        setError("Network error");
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const markRead = useCallback(
    async (alertId: string) => {
      try {
        await fetch("/api/watchlist/alerts/mark-read", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        });
        await load();
      } catch {
        setError("Could not mark read");
      }
    },
    [load],
  );

  const markMonitoringRead = useCallback(
    async (alertId: string) => {
      try {
        await fetch("/api/monitoring/alerts/read", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId }),
        });
        await loadMonitoring();
      } catch {
        setError("Could not mark read");
      }
    },
    [loadMonitoring],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Alert Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Watchlist and investor alerts with optional AI explanations. Nothing executes automatically — review and
            decide.
          </p>
          <p className="mt-2 text-xs text-white/45">
            Data source: platform alerts (LECIPM). AI output is advisory when OPENAI is configured.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap justify-end gap-2 text-xs">
            <Link href="/dashboard/broker/watchlist" className="text-[#D4AF37]/90 underline-offset-4 hover:underline">
              Watchlist
            </Link>
            <Link
              href="/dashboard/broker/saved-searches"
              className="text-[#D4AF37]/90 underline-offset-4 hover:underline"
            >
              Saved searches
            </Link>
          </div>
          <div className="flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setTab("watchlist")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === "watchlist" ? "bg-[#D4AF37] text-black" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Listing watchlist
            </button>
            <button
              type="button"
              onClick={() => setTab("monitoring")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === "monitoring" ? "bg-[#D4AF37] text-black" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Saved search inbox
            </button>
          </div>
          <Link
            href="/dashboard/broker/settings/notifications"
            className="text-xs text-[#D4AF37]/90 underline-offset-4 hover:underline"
          >
            Notification settings
          </Link>
          <button
            type="button"
            onClick={() => {
              void load();
              void loadMonitoring();
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Refresh
          </button>
          <Link href="/dashboard/broker/digest" className="text-sm text-[#D4AF37]/90 hover:underline">
            Morning briefing →
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {tab === "watchlist" && loading ? <p className="text-sm text-white/50">Loading alerts…</p> : null}

      {tab === "watchlist" && !loading && items.length === 0 ? (
        <p className="text-sm text-white/50">No alerts yet. Saved listings and watchlist activity will appear here.</p>
      ) : null}

      {tab === "monitoring" && loadingMonitoring ? (
        <p className="text-sm text-white/50">Loading saved search and watchlist signals…</p>
      ) : null}

      {tab === "monitoring" && !loadingMonitoring && monitoringItems.length === 0 ? (
        <p className="text-sm text-white/50">
          No inbox items yet. Run a saved search (with LECIPM_MONITORING_DATA_LAYER=true) or watchlist checks.
        </p>
      ) : null}

      <div className="space-y-4">
        {tab === "watchlist"
          ? items.map((item) => {
              const analysis = analysisById[item.id];
              return (
                <div key={item.id} className="space-y-4 rounded-2xl border border-white/10 bg-black/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[#D4AF37]">{item.title}</div>
                      {item.listing ? (
                        <div className="mt-1 text-xs text-white/50">
                          {item.listing.title} · {item.listing.city}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-xs uppercase text-white/50">
                      <div>{item.severity}</div>
                      <div className="mt-1 text-[10px] normal-case text-white/40">
                        {item.alertType.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-white/75">{item.message}</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void generateBrief(item.id)}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {busyId === item.id ? "Generating…" : analysis ? "Regenerate AI brief" : "Generate AI brief"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadAnalysis(item.id)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
                    >
                      Reload brief
                    </button>
                    <button
                      type="button"
                      onClick={() => void markRead(item.id)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
                    >
                      Mark read
                    </button>
                  </div>

                  <AlertExplanationCard analysis={analysis ?? undefined} />
                </div>
              );
            })
          : monitoringItems.map((item) => (
              <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 bg-black/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-lg font-semibold text-[#D4AF37]">{item.title}</div>
                  <div className="text-right text-xs uppercase text-white/50">
                    <div>{item.severity}</div>
                    <div className="mt-1 text-[10px] normal-case text-white/40">
                      {item.alertType.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/75">{item.message}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={item.read}
                    onClick={() => void markMonitoringRead(item.id)}
                    className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    {item.read ? "Read" : "Mark read"}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
