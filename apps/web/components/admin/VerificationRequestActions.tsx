"use client";

import { useState } from "react";

export function VerificationRequestActions({ requestId }: { requestId: string }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(status: "approved" | "rejected") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/trust/verification-request/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setMsg(status === "approved" ? "Approved." : "Rejected.");
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-w-[12rem] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit("approved")}
        className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit("rejected")}
        className="rounded bg-red-800 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
      {msg ? <span className="text-xs text-zinc-400">{msg}</span> : null}
    </div>
  );
}
