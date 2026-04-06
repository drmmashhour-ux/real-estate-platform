"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingStatus } from "@prisma/client";

export type HostListingRow = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  listingStatus: ListingStatus;
  nightPriceCents: number;
};

function statusLabel(s: ListingStatus): string {
  if (s === ListingStatus.PUBLISHED) return "Live";
  if (s === ListingStatus.DRAFT) return "Draft";
  if (s === ListingStatus.UNLISTED) return "Paused";
  if (s === ListingStatus.PENDING_REVIEW) return "In review";
  return "Other";
}

export function HostMyListingsClient({ listings }: { listings: HostListingRow[] }) {
  const router = useRouter();
  const [priceFor, setPriceFor] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function savePrice(id: string) {
    const n = parseFloat(newPrice);
    if (!Number.isFinite(n) || n < 0) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/host/listings/${id}/wizard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerNight: n }),
      });
      if (r.ok) {
        setPriceFor(null);
        setNewPrice("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function pauseListing(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/host/listings/${id}/wizard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingStatus: "UNLISTED" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {listings.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
          No listings yet. Create one in about two minutes.
        </p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{l.title}</p>
                <p className="text-sm text-slate-400">
                  {l.city} · {l.listingCode}
                </p>
                <p className="mt-1 text-sm text-emerald-400">
                  ${(l.nightPriceCents / 100).toFixed(0)} / night ·{" "}
                  <span className="text-slate-400">{statusLabel(l.listingStatus)}</span>
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit`}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPriceFor(l.id);
                    setNewPrice(String(l.nightPriceCents / 100));
                  }}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white"
                >
                  Edit price
                </button>
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit#photos`}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white"
                >
                  Add photo
                </Link>
                {l.listingStatus === ListingStatus.PUBLISHED ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pauseListing(l.id)}
                    className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm text-amber-200"
                  >
                    Pause listing
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {priceFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-xl">
            <p className="text-sm font-medium text-white">New price per night (CAD)</p>
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/20 py-2 text-sm"
                onClick={() => setPriceFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950"
                onClick={() => void savePrice(priceFor)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
