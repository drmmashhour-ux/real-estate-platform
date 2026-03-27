"use client";

import { useState } from "react";

export function ReconciliationControls({
  entryId,
  initialStatus,
}: {
  entryId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    const res = await fetch(`/api/admin/accounting/reconciliation/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status, notes: notes || undefined }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error || "Failed");
    else setMsg("Updated");
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <select
        className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="unreconciled">unreconciled</option>
        <option value="matched">matched</option>
        <option value="flagged">flagged</option>
      </select>
      <input
        placeholder="Notes"
        className="min-w-[120px] rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        type="button"
        onClick={() => void save()}
        className="rounded bg-white/10 px-2 py-1 text-xs text-white"
      >
        Save
      </button>
      {msg ? <span className="text-xs text-emerald-400">{msg}</span> : null}
    </div>
  );
}
