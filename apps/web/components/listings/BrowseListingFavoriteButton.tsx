"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  listingId: string;
  kind: "fsbo" | "crm";
  className?: string;
};

/** Heart control for FSBO rows — uses buyer saved-listings API when signed in. */
export function BrowseListingFavoriteButton({ listingId, kind, className = "" }: Props) {
  const { showToast } = useToast();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind !== "fsbo") return;
    void fetch("/api/buyer/saved-listings", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { savedIds?: string[] } | null) => {
        if (j?.savedIds) setSaved(j.savedIds.includes(listingId));
        else setSaved(false);
      })
      .catch(() => setSaved(false));
  }, [kind, listingId]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (kind !== "fsbo" || busy) return;
      setBusy(true);
      try {
        const r = await fetch("/api/buyer/saved-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ fsboListingId: listingId }),
        });
        if (r.status === 401) {
          window.location.href = `/auth/login?returnUrl=${encodeURIComponent("/listings/saved")}`;
          return;
        }
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          showToast(j.error?.trim() || "Could not update saved listings. Try again.", "error");
          return;
        }
        const j = (await r.json()) as { saved?: boolean };
        const next = Boolean(j.saved);
        setSaved(next);
        showToast(
          next
            ? "Saved — view all in My saved."
            : "Removed from your saved list.",
          "success"
        );
      } finally {
        setBusy(false);
      }
    },
    [kind, listingId, busy, showToast]
  );

  if (kind !== "fsbo") return null;

  const filled = saved === true;
  const label = saved === null ? "Save listing" : filled ? "Remove from saved" : "Save listing";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={busy || saved === null}
      onClick={toggle}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#111]/90 text-[#D4AF37] backdrop-blur-sm transition hover:border-[#D4AF37]/55 hover:bg-[#1a1a1a] disabled:opacity-50 ${className}`.trim()}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
