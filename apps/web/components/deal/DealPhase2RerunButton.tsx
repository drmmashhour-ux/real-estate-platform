"use client";

import { useState } from "react";

export function DealPhase2RerunButton({
  listingId,
  shortTermListingId,
}: {
  listingId: string;
  /** Optional BNHUB listing to merge into this FSBO analysis. */
  shortTermListingId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onRun() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${listingId}/rerun-phase2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortTermListingId: shortTermListingId?.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMessage(j?.error ?? "Could not run Phase 2");
        return;
      }
      setMessage("Phase 2 updated — refreshing…");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void onRun()}
        disabled={loading}
        className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-medium text-premium-gold disabled:opacity-50"
      >
        {loading ? "Running Phase 2…" : "Run market intelligence (Phase 2)"}
      </button>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
