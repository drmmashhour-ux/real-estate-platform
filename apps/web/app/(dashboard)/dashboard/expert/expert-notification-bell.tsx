"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const GOLD = "#C9A646";

type NotifRow = {
  id: string;
  title: string;
  body: string | null;
  leadId: string | null;
  readAt: string | null;
  createdAt: string;
};

export function ExpertNotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/mortgage/expert/notifications", { credentials: "same-origin" });
    if (!res.ok) return;
    const j = (await res.json()) as { notifications?: NotifRow[]; unreadCount?: number };
    setItems(j.notifications ?? []);
    setUnread(typeof j.unreadCount === "number" ? j.unreadCount : 0);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
    const t = setInterval(() => {
      void load();
    }, 45_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      void load();
    });
  }, [open, load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function markAllRead() {
    await fetch("/api/mortgage/expert/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ markAll: true }),
    });
    void load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-[#C9A646] hover:bg-white/5"
      >
        <span className="text-lg" aria-hidden>
          🔔
        </span>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#C9A646] px-1 text-center text-[10px] font-bold text-black">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-[min(70vh,420px)] overflow-auto rounded-xl border border-white/10 bg-[#0B0B0B] shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-black/80 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              New leads
            </span>
            {unread > 0 ? (
              <button type="button" onClick={() => void markAllRead()} className="text-[10px] font-semibold text-[#B3B3B3] hover:text-white">
                Mark read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-[#737373]">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => (
                <li key={n.id} className="px-3 py-3">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  {n.body ? (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-[#B3B3B3]">{n.body}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {n.leadId ? (
                      <Link
                        href="/dashboard/expert/leads"
                        className="text-[10px] font-bold text-[#C9A646] hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        View leads →
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
