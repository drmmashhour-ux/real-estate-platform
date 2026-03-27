"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  listingId: string;
  status: string;
  adminNote: string | null;
  reviewedAt: Date | null;
  listing: {
    id: string;
    title: string;
    address: string;
    city: string;
    listingCode: string;
  } | null;
};

export function ListingComplianceClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(listingId: string, status: string) {
    setBusy(listingId);
    try {
      const res = await fetch(`/api/admin/listing-compliance/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows((prev) =>
        prev.map((r) =>
          r.listingId === listingId
            ? { ...r, status: data.status, reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : null }
            : r
        )
      );
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="mt-8 text-slate-500">
        No compliance review rows yet. Submissions appear after seller declaration when the admin approval gate is on.
      </p>
    );
  }

  return (
    <ul className="mt-8 space-y-3">
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-white/10 bg-black/40 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-slate-100">{r.listing?.title ?? "Listing"}</p>
              <p className="text-xs text-slate-500">
                {r.listing?.listingCode} · {r.listing?.address}, {r.listing?.city}
              </p>
              <p className="mt-1 text-sm text-slate-400">Status: {r.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === r.listingId}
                onClick={() => void patch(r.listingId, "approved")}
                className="rounded-lg bg-emerald-800 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy === r.listingId}
                onClick={() => void patch(r.listingId, "needs_correction")}
                className="rounded-lg border border-amber-700 px-3 py-1 text-xs text-amber-200 hover:bg-amber-950/50 disabled:opacity-50"
              >
                Request correction
              </button>
              <button
                type="button"
                disabled={busy === r.listingId}
                onClick={() => void patch(r.listingId, "rejected")}
                className="rounded-lg border border-red-800 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
              >
                Reject
              </button>
              <Link
                href={`/bnhub/host/listings/${r.listingId}/disclosure`}
                className="rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
              >
                View disclosure
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
