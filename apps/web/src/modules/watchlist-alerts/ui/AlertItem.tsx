"use client";

import { cityToSlug } from "@/lib/market/slug";
import { track } from "@/lib/tracking";
import { SeverityBadge } from "@/src/modules/watchlist-alerts/ui/SeverityBadge";

export function AlertItem({ alert, onChanged }: { alert: any; onChanged: () => void }) {
  async function markRead() {
    await fetch("/api/watchlist/alerts/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: alert.id }),
    }).catch(() => null);
    track("watchlist_alert_opened", { meta: { alertId: alert.id, type: alert.alertType } });
    onChanged();
  }

  async function dismiss() {
    await fetch("/api/watchlist/alerts/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId: alert.id }),
    }).catch(() => null);
    track("watchlist_alert_dismissed", { meta: { alertId: alert.id, type: alert.alertType } });
    onChanged();
  }

  const city = alert.listing?.city ?? "";
  const href = city ? `/analysis/${cityToSlug(city)}/${alert.listingId}` : `/analysis`;
  const ts = new Date(alert.createdAt).toLocaleString();

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{alert.title}</p>
          <p className="mt-1 text-xs text-slate-400">{alert.message}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {alert.listing?.title ?? alert.listingId} · {ts}
          </p>
        </div>
        <SeverityBadge severity={alert.severity} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {alert.status === "unread" ? (
          <button onClick={markRead} className="rounded border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/5">
            Mark read
          </button>
        ) : null}
        <button onClick={dismiss} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/5">
          Dismiss
        </button>
        <a href={href} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5">
          Open property
        </a>
      </div>
    </div>
  );
}
