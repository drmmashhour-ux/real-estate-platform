"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/trackEvent";

export function ShareAnalysisButton({ listingId }: { listingId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onShare() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/fsbo-listings/${listingId}/share-analysis`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setMessage(j.error ?? "Could not create link");
        return;
      }
      if (j.url) {
        await navigator.clipboard.writeText(j.url);
        trackEvent("listing_analysis_share_clicked", { listingId });
        setMessage("Link copied — send it to colleagues or clients.");
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Share analysis</p>
      <p className="mt-1 text-xs text-slate-500">Creates a read-only snapshot (scores & signals — not full listing data).</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onShare()}
        className="mt-3 w-full rounded-full border border-premium-gold/40 bg-premium-gold/10 py-2.5 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/20 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Copy share link"}
      </button>
      {message ? <p className="mt-2 text-xs text-emerald-200/90">{message}</p> : null}
    </div>
  );
}
