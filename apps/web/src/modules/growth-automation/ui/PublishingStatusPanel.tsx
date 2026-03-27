"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  topic: string;
  platform: string;
  status: string;
  externalPostId: string | null;
  lastError: string | null;
};

export function PublishingStatusPanel() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetch("/api/growth/content/calendar")
      .then((r) => r.json())
      .then((d) =>
        setItems(
          (d.items as Item[]).filter((i) =>
            ["PUBLISHED", "FAILED", "SCHEDULED"].includes(i.status),
          ),
        ),
      )
      .catch(() => setItems([]));
  }, []);

  if (!items) return <p className="text-sm text-slate-500">Loading status…</p>;

  return (
    <ul className="space-y-2 text-sm">
      {items.length === 0 && <li className="text-slate-500">No scheduled or published items yet.</li>}
      {items.map((i) => (
        <li key={i.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-slate-200">{i.topic}</span>
          <span className="ml-2 text-xs text-slate-500">{i.platform}</span>
          <span
            className={`ml-2 text-xs ${i.status === "FAILED" ? "text-red-400" : "text-emerald-400/90"}`}
          >
            {i.status}
          </span>
          {i.externalPostId && (
            <span className="mt-1 block truncate text-xs text-slate-500">id: {i.externalPostId}</span>
          )}
          {i.lastError && <span className="mt-1 block text-xs text-red-400/90">{i.lastError}</span>}
        </li>
      ))}
    </ul>
  );
}
