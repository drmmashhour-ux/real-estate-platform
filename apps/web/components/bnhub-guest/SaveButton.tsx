"use client";

import { useState } from "react";

export function SaveButton({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/bnhub/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, favorited: !saved }),
      });
      if (res.ok) setSaved(!saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-50"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
