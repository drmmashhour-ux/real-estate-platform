"use client";

import { useState } from "react";
import { track } from "@/lib/tracking";

export function SaveToWatchlistButton({ listingId, initiallySaved = false }: { listingId: string; initiallySaved?: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          const path = saved ? "/api/watchlist/remove" : "/api/watchlist/add";
          const event = saved ? "watchlist_item_removed" : "watchlist_item_added";
          track(event, { meta: { listingId } });
          const res = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          }).catch(() => null);
          if (res?.ok) {
            const next = !saved;
            setSaved(next);
            setFeedback(next ? "Saved to Watchlist" : "Removed from Watchlist");
            setTimeout(() => setFeedback(null), 1800);
          }
          setLoading(false);
        }}
        className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-60 ${
          saved
            ? "border-premium-gold/50 bg-premium-gold/15 text-premium-gold"
            : "border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {loading ? "Working..." : saved ? "Watching this property" : "Save to Watchlist"}
      </button>
      {feedback ? <p className="mt-1 text-[11px] text-slate-400">{feedback}</p> : null}
    </div>
  );
}
