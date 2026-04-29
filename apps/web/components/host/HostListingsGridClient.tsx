"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ListingStatusClient, type ListingHostFilterStatus } from "@/types/listing-status-client";
import type { HostListingManageRow } from "@/lib/host/listings-data";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";
import { EmptyState } from "@/components/ui/EmptyState";

const GOLD = "#D4AF37";

const SORTS = ["recent", "price_asc", "price_desc", "title_asc"] as const;
type SortKey = (typeof SORTS)[number];

type StatusFilter = "ALL" | ListingHostFilterStatus;

function statusLabel(s: ListingHostFilterStatus): string {
  if (s === ListingStatusClient.PUBLISHED) return "Live";
  if (s === ListingStatusClient.DRAFT) return "Draft";
  if (s === ListingStatusClient.UNLISTED) return "Paused";
  if (s === ListingStatusClient.PENDING_REVIEW) return "In review";
  return String(s);
}

function sortLabel(k: SortKey): string {
  if (k === "recent") return "Recently updated";
  if (k === "price_asc") return "Price: low to high";
  if (k === "price_desc") return "Price: high to low";
  return "Title: A–Z";
}

export function HostListingsGridClient({
  listings,
  newestListingId,
}: {
  listings: HostListingManageRow[];
  /** Most recently updated listing — used for “Add listing” clone link */
  newestListingId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [priceFor, setPriceFor] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let rows = [...listings];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.listingCode.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((l) => l.listingStatus === statusFilter);
    }
    rows.sort((a, b) => {
      switch (sortKey) {
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "price_asc":
          return a.nightPriceCents - b.nightPriceCents;
        case "price_desc":
          return b.nightPriceCents - a.nightPriceCents;
        case "title_asc":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return rows;
  }, [listings, search, statusFilter, sortKey]);

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

  async function goLive(id: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/host/listings/${id}/wizard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingStatus: "PUBLISHED" }),
      });
      if (!r.ok) {
        window.alert("Could not publish. Finish required fields or verification in the editor.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const addListingHref =
    newestListingId != null
      ? `/host/listings/new?from=${encodeURIComponent(newestListingId)}`
      : "/host/listings/new";

  if (!listings.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#111] p-10 text-center">
        <p className="text-lg font-medium text-white">Create your first listing</p>
        <p className="mt-2 text-sm text-zinc-500">It only takes a few minutes to go live on BNHUB.</p>
        <p className="mt-3 text-xs text-zinc-600">
          Use <span className="text-zinc-400">Save &amp; continue</span> on each step until you reach publish.
        </p>
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
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-[#0c0c0c] p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="host-listings-search" className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Search
          </label>
          <input
            id="host-listings-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, city, or code"
            className="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[140px] flex-col gap-1">
            <label htmlFor="host-listings-status" className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Status
            </label>
            <select
              id="host-listings-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
            >
              <option value="ALL">All statuses</option>
              <option value={ListingStatusClient.PUBLISHED}>Live</option>
              <option value={ListingStatusClient.DRAFT}>Draft</option>
              <option value={ListingStatusClient.UNLISTED}>Paused</option>
              <option value={ListingStatusClient.PENDING_REVIEW}>In review</option>
            </select>
          </div>
          <div className="flex min-w-[160px] flex-col gap-1">
            <label htmlFor="host-listings-sort" className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Sort
            </label>
            <select
              id="host-listings-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-xl border border-zinc-700 bg-black px-3 py-2.5 text-sm text-white focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
            >
              {SORTS.map((k) => (
                <option key={k} value={k}>
                  {sortLabel(k)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="w-full text-xs text-zinc-600 sm:w-auto sm:text-right">
          Showing{" "}
          <span className="text-zinc-400">
            {filtered.length} of {listings.length}
          </span>
          {newestListingId ? (
            <>
              {" "}
              · New listings can copy details from your latest update (
              <Link href={addListingHref} className="text-amber-500/90 underline-offset-2 hover:underline">
                start from saved info
              </Link>
              ).
            </>
          ) : null}
        </p>
      </div>

      {!filtered.length ? (
        <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
          <>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setSortKey("recent");
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              style={{ backgroundColor: GOLD }}
            >
              Reset filters
            </button>
            <Link
              href="/explore"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 px-6 py-3 text-sm font-semibold transition hover:bg-white/[0.06]"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              Browse featured listings
            </Link>
          </>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
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
                  {l.listingStatus === ListingStatusClient.PUBLISHED ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void pauseListing(l.id)}
                      className="rounded-xl border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
                    >
                      Pause (inactive)
                    </button>
                  ) : null}
                  {l.listingStatus === ListingStatusClient.UNLISTED ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void goLive(l.id)}
                      className="rounded-xl border border-emerald-700/50 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-950/30"
                    >
                      Go live (active)
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
      )}

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
            <p className="mt-2 text-xs text-zinc-500">Cancel keeps your current nightly price on BNHUB.</p>
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
