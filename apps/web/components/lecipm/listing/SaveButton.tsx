"use client";

import { useCallback, useState } from "react";

export type SaveButtonProps = {
  listingId: string;
  className?: string;
  onSaved?: () => void;
};

/** Persists via POST /api/watchlist/add (session required). */
export function SaveButton({ listingId, className = "", onSaved }: SaveButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/watchlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        setDone(true);
        onSaved?.();
      }
    } finally {
      setBusy(false);
    }
  }, [listingId, onSaved]);

  return (
    <button
      type="button"
      disabled={busy || done}
      onClick={onClick}
      className={`rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-premium-gold/40 disabled:opacity-60 ${className}`}
    >
      {done ? "Saved" : busy ? "…" : "Save"}
    </button>
  );
}
