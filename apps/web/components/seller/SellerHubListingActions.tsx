"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
  canDelete: boolean;
  editHref: string;
};

export function SellerHubListingActions({ listingId, canDelete, editHref }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!canDelete) return;
    if (!window.confirm("Delete this listing permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/fsbo/listings/${encodeURIComponent(listingId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : "Could not delete");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={editHref}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-[#E8C547] hover:bg-white/5"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={!canDelete || busy}
        onClick={() => void onDelete()}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}
