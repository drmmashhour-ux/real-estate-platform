"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingStatus } from "@prisma/client";
import type { HostListingManageRow } from "@/lib/host/listings-data";

const GOLD = "#D4AF37";

function statusLabel(s: ListingStatus): string {
  if (s === ListingStatus.PUBLISHED) return "Live";
  if (s === ListingStatus.DRAFT) return "Draft";
  if (s === ListingStatus.UNLISTED) return "Paused";
  if (s === ListingStatus.PENDING_REVIEW) return "In review";
  return String(s);
}

export function HostListingsGridClient({ listings }: { listings: HostListingManageRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [priceFor, setPriceFor] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

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

  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-10 text-center">
        <p className="text-lg font-medium text-white">Create your first listing</p>
        <p className="mt-2 text-sm text-zinc-500">It only takes a few minutes to go live on BNHub.</p>
        <Link
          href="/host/listings/new"
          className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-black"
          style={{ backgroundColor: GOLD }}
        >
          Add listing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((l) => (
          <li
            key={l.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#111] shadow-sm"
          >
            <div className="relative aspect-[16/10] bg-zinc-900">
              {l.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-600">No photo</div>
              )}
              <span className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                {statusLabel(l.listingStatus)}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="line-clamp-2 font-semibold text-white">{l.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {l.city} · {l.listingCode}
              </p>
              <p className="mt-2 text-sm" style={{ color: GOLD }}>
                ${(l.nightPriceCents / 100).toFixed(0)} <span className="text-zinc-500">/ night</span>
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {l.views} views · {l.bookings} bookings · {l.occupancyLabel}
              </p>
              {l.aiBadges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {l.aiBadges.map((b) => (
                    <span
                      key={b}
                      className="rounded-md border border-zinc-700 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex flex-1 flex-wrap gap-2">
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit`}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-black"
                  style={{ backgroundColor: GOLD }}
                >
                  Edit listing
                </Link>
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit`}
                  className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Optimize
                </Link>
                <Link
                  href="/host/pricing"
                  className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  AI price
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPriceFor(l.id);
                    setNewPrice(String(l.nightPriceCents / 100));
                  }}
                  className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Edit price
                </button>
                <Link
                  href={`/host/calendar?listing=${l.id}`}
                  className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Calendar
                </Link>
                {l.listingStatus === ListingStatus.PUBLISHED ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pauseListing(l.id)}
                    className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
                  >
                    Pause
                  </button>
                ) : null}
                <Link
                  href={`/bnhub/host/marketing/listings/${l.id}`}
                  className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Promote
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {priceFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111] p-5 shadow-xl">
            <p className="text-sm font-medium text-white">Price per night (CAD)</p>
            <input
              type="number"
              min={0}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-white"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-zinc-600 py-2 text-sm text-zinc-300"
                onClick={() => setPriceFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-xl py-2 text-sm font-semibold text-black disabled:opacity-50"
                style={{ backgroundColor: GOLD }}
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
