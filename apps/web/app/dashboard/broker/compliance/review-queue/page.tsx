"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type QueueItem = {
  id: string;
  moduleKey: string;
  actionKey: string;
  reason: string;
  priority: string;
  status: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export default function ComplianceReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/review-queue", { credentials: "same-origin" });
      const data = (await res.json()) as { success?: boolean; items?: QueueItem[]; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to load review queue");
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("Network error");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string, status: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/review-queue/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reviewId: id, status, note: noteById[id]?.trim() || null }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Resolve failed");
        return;
      }
      await load();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Compliance review queue</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Actions escalated by autonomous guardrails (manual review required). Resolve items here after human
            verification — AI may summarize only; it cannot approve on your behalf.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/dashboard/broker/compliance/audit"
            className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Audit trail
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 && !busy ? (
          <p className="text-sm text-white/50">No open review items for your scope.</p>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#D4AF37]/20 bg-black/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-white">
                {item.moduleKey} · {item.actionKey}
              </div>
              <div className="text-xs uppercase tracking-wide text-[#D4AF37]">
                {item.priority} · {item.status}
              </div>
            </div>
            <div className="mt-2 text-sm text-white/60">{item.reason}</div>
            <div className="mt-1 text-xs text-white/40">
              {item.entityType}
              {item.entityId ? ` · ${item.entityId}` : ""} · {new Date(item.createdAt).toLocaleString("en-CA")}
            </div>
            <textarea
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30"
              rows={2}
              placeholder="Internal note (optional)"
              value={noteById[item.id] ?? ""}
              onChange={(e) => setNoteById((m) => ({ ...m, [item.id]: e.target.value }))}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void resolve(item.id, "approved")}
                className="rounded-lg bg-emerald-700/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void resolve(item.id, "rejected")}
                className="rounded-lg bg-red-800/70 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void resolve(item.id, "closed")}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/5 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
