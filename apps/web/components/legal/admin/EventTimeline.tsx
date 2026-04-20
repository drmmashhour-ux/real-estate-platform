"use client";

import { useEffect, useState } from "react";

type TimelineRow = {
  id: string;
  eventType: string;
  entityType: string;
  actorType: string;
  createdAt: string;
};

export function EventTimeline(props: {
  entityType: string;
  entityId: string;
  title?: string;
}) {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({
      entityType: props.entityType,
      entityId: props.entityId,
    });
    setLoading(true);
    void fetch(`/api/admin/events?${q.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json() as Promise<{ disabled?: boolean; timeline?: { events: TimelineRow[] } }>)
      .then((body) => {
        if (cancelled) return;
        setDisabled(!!body.disabled);
        setRows(Array.isArray(body.timeline?.events) ? body.timeline!.events : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [props.entityType, props.entityId]);

  if (loading) {
    return <p className="text-xs text-slate-500">Loading event timeline…</p>;
  }
  if (disabled) {
    return (
      <p className="text-[11px] text-slate-600">
        Event timeline is disabled. Set <code className="rounded bg-slate-800 px-1">FEATURE_EVENT_TIMELINE_V1=true</code>.
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="text-[11px] text-slate-600">No recorded events for this entity yet.</p>;
  }

  return (
    <section className="space-y-2 rounded-xl border border-slate-700/80 bg-slate-950/40 p-4">
      <h3 className="text-sm font-semibold text-slate-200">{props.title ?? "Compliance timeline"}</h3>
      <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/80 pb-2 last:border-0"
          >
            <span className="font-mono text-emerald-400/95">{r.eventType}</span>
            <span className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
            <span className="w-full text-[10px] text-slate-600">
              {r.entityType} · actor {r.actorType}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
