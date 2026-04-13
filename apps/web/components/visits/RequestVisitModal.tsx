"use client";

import { useCallback, useEffect, useState } from "react";

type Slot = { start: string; end: string };

export function RequestVisitModal({
  open,
  onClose,
  listingId,
  listingTitle,
  leadId,
  threadId,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  leadId: string;
  threadId: string | null;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [duration, setDuration] = useState(45);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = new Date();
      const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
      const q = new URLSearchParams({
        listingId,
        from: from.toISOString(),
        to: to.toISOString(),
        durationMinutes: String(duration),
      });
      const res = await fetch(`/api/visits/slots?${q.toString()}`);
      const j = (await res.json()) as { slots?: Slot[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Could not load times");
      setSlots(Array.isArray(j.slots) ? j.slots : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [listingId, duration]);

  useEffect(() => {
    if (open) {
      setSuccess(null);
      setSelected(null);
      void loadSlots();
    }
  }, [open, loadSlots]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/visits/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId,
          leadId,
          threadId: threadId ?? undefined,
          requestedStart: selected,
          durationMinutes: duration,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Request failed");
      setSuccess("Visit request sent. Your broker will confirm in the thread.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-slate-950 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">Request a visit</h2>
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{listingTitle}</p>
          </div>
          <button type="button" className="text-sm text-slate-400 hover:text-white" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <label className="text-slate-500">
            Duration
            <select
              className="ml-2 rounded-lg border border-white/15 bg-black/50 px-2 py-1 text-white"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </label>
          <button
            type="button"
            className="text-xs text-premium-gold hover:underline"
            onClick={() => void loadSlots()}
          >
            Refresh times
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}

        {loading ? <p className="mt-4 text-sm text-slate-500">Loading available times…</p> : null}
        {!loading && slots.length === 0 && !success ? (
          <p className="mt-4 text-sm text-slate-500">
            No open slots in the next two weeks. Message the broker to coordinate manually.
          </p>
        ) : null}

        <ul className="mt-4 grid max-h-[240px] gap-2 overflow-y-auto sm:grid-cols-2">
          {slots.map((s) => (
            <li key={s.start}>
              <button
                type="button"
                onClick={() => setSelected(s.start)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selected === s.start
                    ? "border-premium-gold bg-premium-gold/10 text-white"
                    : "border-white/10 bg-black/30 text-slate-200 hover:border-white/20"
                }`}
              >
                {new Date(s.start).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!submitting || !selected || !!success}
            onClick={() => void submit()}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {submitting ? "Sending…" : "Confirm request"}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300">
            Cancel
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-600">
          The broker must accept the visit. You’ll see updates in this conversation.
        </p>
      </div>
    </div>
  );
}
