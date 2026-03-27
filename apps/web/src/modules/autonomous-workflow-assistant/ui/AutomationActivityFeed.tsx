"use client";

import { useEffect, useState } from "react";

type FeedEvent = {
  id: string;
  actionType: string;
  status: string;
  triggerType: string;
  createdAt: string;
};

export function AutomationActivityFeed({ documentId }: { documentId: string | null }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/autonomous-workflow/automation-events?documentId=${encodeURIComponent(documentId)}`)
      .then((r) => r.json())
      .then((j: { events?: FeedEvent[] }) => {
        if (cancelled) return;
        setEvents(j.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (!documentId) return null;
  if (loading && !events.length) return <p className="text-[10px] text-slate-600">Loading automation log…</p>;
  if (!events.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#08090a] p-3 text-[10px] text-slate-500 shadow-inner shadow-black/50">
      <p className="font-semibold uppercase tracking-wide text-slate-400">Automation activity</p>
      <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="border-b border-white/[0.04] pb-1 font-mono text-[9px] last:border-0">
            {new Date(e.createdAt).toLocaleString()} · {e.actionType} · {e.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
