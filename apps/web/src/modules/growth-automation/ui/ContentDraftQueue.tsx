"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  topic: string;
  platform: string;
  status: string;
  updatedAt: string;
};

export function ContentDraftQueue() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/growth/content/calendar")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else
          setItems(
            (d.items as Item[]).map((i) => ({
              id: i.id,
              topic: i.topic,
              platform: i.platform,
              status: i.status,
              updatedAt: i.updatedAt,
            })),
          );
      })
      .catch(() => setError("Failed to load"));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const res = await fetch("/api/growth/content/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id }),
    });
    if (res.ok) load();
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!items) return <p className="text-sm text-slate-500">Loading queue…</p>;

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-slate-500">No content items yet.</p>}
      {items.map((i) => (
        <div
          key={i.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium text-slate-100">{i.topic}</span>
            <span className="ml-2 text-xs text-slate-500">
              {i.platform} · {i.status}
            </span>
          </div>
          {(i.status === "PENDING_REVIEW" || i.status === "DRAFT") && (
            <button
              type="button"
              onClick={() => approve(i.id)}
              className="rounded bg-amber-600/90 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500"
            >
              Approve
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
