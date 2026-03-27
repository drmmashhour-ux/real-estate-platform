"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionQueueItemCard, type ActionQueueRow } from "./ActionQueueItemCard";

type Props = {
  initial: ActionQueueRow[];
  filter?: "open" | "overdue" | "dueToday";
};

export function ActionQueueList({ initial, filter = "open" }: Props) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ limit: "80", includeDone: filter === "open" ? "0" : "1" });
    if (filter === "overdue") sp.set("overdue", "1");
    if (filter === "dueToday") sp.set("dueToday", "1");
    const res = await fetch(`/api/action-queue?${sp}`, { credentials: "same-origin" });
    const j = (await res.json()) as { items?: ActionQueueRow[] };
    if (j.items) setItems(j.items);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/action-queue/${encodeURIComponent(id)}/complete`, {
        method: "POST",
        credentials: "same-origin",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function dismiss(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/action-queue/${encodeURIComponent(id)}/dismiss`, {
        method: "POST",
        credentials: "same-origin",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No pending actions right now. Your action queue shows the next items that need your attention.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <ActionQueueItemCard
          key={it.id}
          item={it}
          busy={busy}
          onComplete={(id) => void complete(id)}
          onDismiss={(id) => void dismiss(id)}
        />
      ))}
    </ul>
  );
}
