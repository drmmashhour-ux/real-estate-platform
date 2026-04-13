"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type N = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  status: string;
  actionUrl: string | null;
};

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<N[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const [c, m, list] = await Promise.all([
      fetch("/api/notifications/unread-count", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/messaging/unread-total", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/notifications?unread=1&limit=6", { credentials: "same-origin" }).then((r) => r.json()),
    ]);
    const notif = typeof c.count === "number" ? c.count : 0;
    const msg = typeof m.total === "number" ? m.total : 0;
    setCount(notif + msg);
    setPreview(Array.isArray(list.notifications) ? list.notifications : []);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 60000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
      credentials: "same-origin",
    });
    void refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-white/15 bg-black/30 p-2 text-slate-200 hover:bg-white/10"
        aria-label="Notifications"
      >
        <span className="text-lg" aria-hidden>
          🔔
        </span>
        {count != null && count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-white/10 bg-[#0f1419] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white">Notifications</span>
            <Link
              href="/dashboard/notifications"
              className="text-xs text-emerald-400 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
          {preview.length === 0 ? (
            <p className="text-xs text-slate-500">No unread items.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {preview.map((n) => (
                <li key={n.id} className="rounded border border-white/5 bg-black/30 p-2 text-xs">
                  <p className="font-medium text-slate-100">{n.title}</p>
                  <p className="text-[10px] text-slate-500">{n.type}</p>
                  <div className="mt-1 flex gap-2">
                    {n.actionUrl ? (
                      <Link
                        href={n.actionUrl}
                        className="text-emerald-400 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        Open
                      </Link>
                    ) : null}
                    <button type="button" className="text-slate-500 hover:text-slate-300" onClick={() => void markRead(n.id)}>
                      Mark read
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/tasks"
            className="mt-2 block text-center text-xs text-slate-400 hover:text-emerald-400"
            onClick={() => setOpen(false)}
          >
            Tasks inbox →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
