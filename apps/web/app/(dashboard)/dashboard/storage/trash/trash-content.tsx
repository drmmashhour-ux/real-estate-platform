"use client";

import { useState, useEffect } from "react";

type TrashItem = {
  id: string;
  fileUrl: string;
  fileType: string;
  originalSize: number;
  deletedAt: string;
  retentionPolicy: string;
};

export function TrashContent() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storage/trash", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.items) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleRestore = async (recordId: string) => {
    setRestoring(recordId);
    try {
      const res = await fetch("/api/storage/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
        credentials: "same-origin",
      });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== recordId));
    } finally {
      setRestoring(null);
    }
  };

  if (loading) return <p className="mt-4 text-sm text-slate-500">Loading…</p>;
  if (items.length === 0) return <p className="mt-4 text-sm text-slate-500">Trash is empty.</p>;

  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <div>
            <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{item.fileUrl.slice(0, 60)}…</p>
            <p className="text-xs text-slate-500">
              {item.fileType} · {(item.originalSize / 1024).toFixed(0)} KB · deleted {new Date(item.deletedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleRestore(item.id)}
            disabled={restoring === item.id}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {restoring === item.id ? "Restoring…" : "Restore"}
          </button>
        </li>
      ))}
    </ul>
  );
}
