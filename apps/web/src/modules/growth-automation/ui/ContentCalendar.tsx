"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  topic: string;
  platform: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
};

export function ContentCalendar() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const qs = `from=${from.toISOString()}&to=${to.toISOString()}`;
    fetch(`/api/growth/content/calendar?${qs}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  if (!items) return <p className="text-sm text-slate-500">Loading calendar…</p>;

  return (
    <ul className="space-y-1 text-xs text-slate-300">
      {items.length === 0 && <li className="text-slate-500">No items in the last 7 days.</li>}
      {items.map((i) => (
        <li key={i.id} className="rounded border border-white/5 px-2 py-1">
          {i.scheduledFor || i.publishedAt || "—"} · {i.platform} · {i.topic.slice(0, 48)}… · {i.status}
        </li>
      ))}
    </ul>
  );
}
