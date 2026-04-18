"use client";

import { useState } from "react";

export function RejectSuggestionButton({
  dealId,
  suggestionId,
  onDone,
}: {
  dealId: string;
  suggestionId: string;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reject() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", suggestionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={loading || !suggestionId}
        onClick={() => void reject()}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-ds-text-secondary hover:bg-white/5 disabled:opacity-40"
      >
        {loading ? "…" : "Reject"}
      </button>
      {err ? <span className="text-[10px] text-red-400">{err}</span> : null}
    </div>
  );
}
