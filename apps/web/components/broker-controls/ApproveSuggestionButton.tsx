"use client";

import { useState } from "react";

export function ApproveSuggestionButton({
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

  async function approve() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", suggestionId }),
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
        onClick={() => void approve()}
        className="rounded-lg bg-ds-gold/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-ds-gold disabled:opacity-40"
      >
        {loading ? "…" : "Approve"}
      </button>
      {err ? <span className="text-[10px] text-red-400">{err}</span> : null}
    </div>
  );
}
