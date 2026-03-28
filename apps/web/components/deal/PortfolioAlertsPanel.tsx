"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioAlertPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type Props = {
  enabled: boolean;
};

export function PortfolioAlertsPanel({ enabled }: Props) {
  const [alerts, setAlerts] = useState<PortfolioAlertPublicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/deal-analyzer/portfolio-alerts", { credentials: "include" });
      if (res.status === 401) {
        setErr("Sign in to view alerts.");
        setAlerts([]);
        return;
      }
      if (!res.ok) {
        setErr("Could not load alerts");
        return;
      }
      const j = (await res.json()) as { alerts?: PortfolioAlertPublicDto[] };
      setAlerts(j.alerts ?? []);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function patch(alertId: string, action: "read" | "dismiss") {
    const res = await fetch(`/api/deal-analyzer/portfolio-alerts/${encodeURIComponent(alertId)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) void load();
  }

  if (!enabled) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Deal watchlist alerts</p>
          <p className="mt-1 text-sm text-slate-500">Deterministic signals from saved listings — not investment advice.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      {err ? <p className="mt-3 text-sm text-amber-200/90">{err}</p> : null}
      {alerts.length === 0 && !loading && !err ? (
        <p className="mt-4 text-sm text-slate-500">No alerts yet. Add listings to a watchlist and refresh.</p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={`rounded-lg border border-white/10 p-3 text-sm ${a.status === "dismissed" ? "opacity-40" : ""}`}
          >
            <p className="font-medium text-white">{a.title}</p>
            <p className="mt-1 text-slate-400">{a.message}</p>
            <p className="mt-2 text-[10px] uppercase text-slate-500">
              {a.alertType.replace(/_/g, " ")} · {a.severity}
            </p>
            {a.status !== "dismissed" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void patch(a.id, "read")}
                  className="text-xs text-premium-gold hover:underline"
                >
                  Mark read
                </button>
                <button
                  type="button"
                  onClick={() => void patch(a.id, "dismiss")}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
