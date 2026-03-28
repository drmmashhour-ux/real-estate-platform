"use client";

import { useMemo, useState } from "react";
import { AlertItem } from "@/src/modules/watchlist-alerts/ui/AlertItem";
import { AlertsEmptyState } from "@/src/modules/watchlist-alerts/ui/AlertsEmptyState";

function sectionLabel(date: Date) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startToday.getDate() - 1);
  if (date >= startToday) return "Today";
  if (date >= startYesterday) return "Yesterday";
  return "Earlier";
}

export function AlertsCenter({ alerts, onChanged, title = "Alerts" }: { alerts: any[]; onChanged: () => void; title?: string }) {
  const [filter, setFilter] = useState("all");
  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "all") return true;
      if (filter === "unread") return a.status === "unread";
      return a.severity === filter;
    });
  }, [alerts, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((a) => {
      const key = sectionLabel(new Date(a.createdAt));
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0c] p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">{title}</h3>
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2 overflow-x-auto text-xs">
          {["all", "unread", "info", "warning", "critical"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-2.5 py-1 whitespace-nowrap ${filter === f ? "border-premium-gold bg-premium-gold/15 text-premium-gold" : "border-white/20 text-slate-300"}`}
            >
              {f === "all" ? "All" : f === "unread" ? "Unread" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-4">
        {!grouped.length ? <AlertsEmptyState /> : null}
        {grouped.map(([label, rows]) => (
          <div key={label}>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <div className="space-y-2">
              {rows.map((a) => (
                <AlertItem key={a.id} alert={a} onChanged={onChanged} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
