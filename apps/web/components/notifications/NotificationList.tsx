"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  status: string;
  priority: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
};

export type Tab = "unread" | "all" | "archived";

type Props = {
  initial: NotificationRow[];
  compact?: boolean;
  onChanged?: () => void;
  /** Default tab (e.g. admin may start on "all"). */
  defaultTab?: Tab;
};

function groupByDay(items: NotificationRow[]): Map<string, NotificationRow[]> {
  const m = new Map<string, NotificationRow[]>();
  for (const it of items) {
    const d = new Date(it.createdAt);
    const key = d.toLocaleDateString(undefined, { dateStyle: "medium" });
    const arr = m.get(key) ?? [];
    arr.push(it);
    m.set(key, arr);
  }
  return m;
}

export function NotificationList({ initial, compact, onChanged, defaultTab = "unread" }: Props) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ limit: compact ? "8" : "40" });
    if (tab === "unread") sp.set("unread", "1");
    else if (tab === "archived") sp.set("status", "ARCHIVED");
    if (typeFilter) sp.set("type", typeFilter);
    const res = await fetch(`/api/notifications?${sp}`, { credentials: "same-origin" });
    const j = (await res.json()) as { notifications?: NotificationRow[] };
    if (j.notifications) setItems(j.notifications);
    onChanged?.();
  }, [tab, typeFilter, compact, onChanged]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        credentials: "same-origin",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function archive(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/archive`, {
        method: "POST",
        credentials: "same-origin",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function markAllRead() {
    setBusy("all");
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "same-origin" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const grouped = useMemo(() => groupByDay(items), [items]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {!compact ? (
          <div className="flex flex-wrap items-center gap-2">
            {(["unread", "all", "archived"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  tab === t
                    ? "rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200"
                    : "rounded-full border border-white/10 px-3 py-1 text-sm text-slate-400 hover:bg-white/5"
                }
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}
        <p className={`text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>
          {tab === "unread" ? "No unread notifications." : "Nothing here yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="flex flex-wrap items-center gap-2">
          {(["unread", "all", "archived"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200"
                  : "rounded-full border border-white/10 px-3 py-1 text-sm text-slate-400 hover:bg-white/5"
              }
            >
              {t}
            </button>
          ))}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border border-white/15 bg-black/40 px-2 py-1 text-sm text-slate-200"
          >
            <option value="">All types</option>
            <option value="MESSAGE">Message</option>
            <option value="OFFER">Offer</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="INTAKE">Intake</option>
            <option value="DOCUMENT">Document</option>
            <option value="CONTRACT">Contract</option>
            <option value="SYSTEM">System</option>
          </select>
          <button type="button" onClick={() => void load()} className="text-sm text-slate-400 hover:text-white">
            Refresh
          </button>
          {tab === "unread" ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={busy === "all"}
              className="text-sm text-emerald-400 hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>
      ) : null}

      {Array.from(grouped.entries()).map(([day, rows]) => (
        <div key={day}>
          {!compact ? <p className="text-xs font-medium uppercase text-slate-500">{day}</p> : null}
          <ul className={`space-y-2 ${compact ? "" : "mt-2"}`}>
            {rows.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border border-white/10 bg-black/20 p-3 ${n.status === "UNREAD" ? "border-emerald-500/30" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-medium uppercase text-slate-500">{n.type}</span>
                    {n.priority !== "NORMAL" ? (
                      <span className="ml-2 text-[10px] uppercase text-amber-400">{n.priority}</span>
                    ) : null}
                    <p className="font-medium text-white">{n.title}</p>
                    {n.message ? <p className="text-sm text-slate-400">{n.message}</p> : null}
                    <p className="mt-1 text-xs text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {n.actionUrl ? (
                      <Link
                        href={n.actionUrl}
                        className="text-xs text-emerald-400 hover:underline"
                        onClick={() => {
                          if (n.status === "UNREAD") void markRead(n.id);
                        }}
                      >
                        {n.actionLabel ?? "Open"}
                      </Link>
                    ) : null}
                    {n.status === "UNREAD" ? (
                      <button
                        type="button"
                        disabled={busy === n.id}
                        onClick={() => void markRead(n.id)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Mark read
                      </button>
                    ) : null}
                    {n.status !== "ARCHIVED" ? (
                      <button
                        type="button"
                        disabled={busy === n.id}
                        onClick={() => void archive(n.id)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Archive
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
