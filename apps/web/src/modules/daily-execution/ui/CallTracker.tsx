"use client";

import { useState } from "react";

type TaskSlice = { completedCount: number; targetCount: number; metadata?: unknown };

export function CallTracker({
  callsTask,
  onBooked,
  onCompleted,
}: {
  callsTask: TaskSlice | null;
  onBooked: () => Promise<void>;
  onCompleted: (leadId: string | null) => Promise<void>;
}) {
  const [leadId, setLeadId] = useState("");
  const [busy, setBusy] = useState<"book" | "done" | null>(null);

  const meta = callsTask?.metadata as { callCompleted?: boolean; linkedLeadId?: string } | undefined;
  const booked = (callsTask?.completedCount ?? 0) >= 1;
  const completed = Boolean(meta?.callCompleted);

  async function bookedClick() {
    setBusy("book");
    try {
      await onBooked();
    } finally {
      setBusy(null);
    }
  }

  async function completedClick() {
    setBusy("done");
    try {
      await onCompleted(leadId.trim() || null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Calls</h2>
      <p className="mt-1 text-xs text-slate-500">Log when you book and when you complete — no dialer automation.</p>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        <div>Booked: {booked ? "yes" : "not yet"}</div>
        <div>Completed: {completed ? "yes" : "not yet"}</div>
      </div>
      <input
        value={leadId}
        onChange={(e) => setLeadId(e.target.value)}
        placeholder="Optional lead / contact ID"
        className="mt-4 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null || booked}
          onClick={() => void bookedClick()}
          className="rounded-md border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/20 disabled:opacity-40"
        >
          {busy === "book" ? "…" : "Mark call booked"}
        </button>
        <button
          type="button"
          disabled={busy !== null || completed || !booked}
          onClick={() => void completedClick()}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {busy === "done" ? "…" : "Mark call completed"}
        </button>
      </div>
    </section>
  );
}
