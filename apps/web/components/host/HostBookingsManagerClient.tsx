"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HostBookingListRow } from "@/lib/host/bookings-data";
import { filterBookingsByTab, type HostBookingsTab } from "./host-bookings-filter";

const GOLD = "#D4AF37";

function dt(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

type Props = {
  bookings: HostBookingListRow[];
  listings: { id: string; title: string }[];
};

const TABS: { id: HostBookingsTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Past" },
  { id: "canceled", label: "Canceled" },
];

export function HostBookingsManagerClient({ bookings, listings }: Props) {
  const [tab, setTab] = useState<HostBookingsTab>("upcoming");
  const [search, setSearch] = useState("");
  const [listingId, setListingId] = useState("");
  const [pay, setPay] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = filterBookingsByTab(bookings, tab);
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          b.propertyTitle.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          (b.confirmationCode?.toLowerCase().includes(q) ?? false)
      );
    }
    if (listingId) r = r.filter((b) => b.listingId === listingId);
    if (pay) r = r.filter((b) => (b.paymentStatus ?? "") === pay);
    if (bookingStatus) r = r.filter((b) => b.bookingStatus === bookingStatus);
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      r = r.filter((b) => dt(b.checkIn as unknown as Date | string) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      r = r.filter((b) => dt(b.checkIn as unknown as Date | string) <= to);
    }
    return r;
  }, [bookings, tab, search, listingId, pay, bookingStatus, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-[#111] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="rounded-xl px-3 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: tab === t.id ? "rgba(212, 175, 55, 0.15)" : "transparent",
                color: tab === t.id ? GOLD : "rgb(161 161 170)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 md:hidden"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          Filters
        </button>
      </div>

      <div
        className={`grid gap-4 rounded-2xl border border-zinc-800 bg-[#111] p-4 sm:grid-cols-2 lg:grid-cols-3 ${
          filtersOpen ? "grid" : "hidden"
        } md:grid`}
      >
        <div>
          <label className="text-xs font-medium text-zinc-500">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guest, property, ref…"
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Property</label>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title.slice(0, 48)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Payment status</label>
          <select
            value={pay}
            onChange={(e) => setPay(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Booking status</label>
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="AWAITING_HOST_APPROVAL">AWAITING_HOST_APPROVAL</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="CANCELLED_BY_GUEST">CANCELLED_BY_GUEST</option>
            <option value="CANCELLED_BY_HOST">CANCELLED_BY_HOST</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Check-in from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Check-in to</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-10 text-center">
          <p className="text-zinc-400">No bookings yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Improve your listing and share your property link to get your first reservation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/host/listings"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-black"
              style={{ backgroundColor: GOLD }}
            >
              Improve your listing
            </Link>
            <Link
              href="/bnhub/host/listings/new"
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Share your property
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-8 text-center text-sm text-zinc-500">
          No bookings match your filters. Try clearing filters or switching tabs.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-4 shadow-sm sm:flex sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{b.propertyTitle}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {dt(b.checkIn as unknown as Date | string).toISOString().slice(0, 10)} →{" "}
                  {dt(b.checkOut as unknown as Date | string).toISOString().slice(0, 10)} ·{" "}
                  {b.nights} nights
                  {b.guestsCount != null ? ` · ${b.guestsCount} guests` : ""}
                </p>
                <p className="mt-1 text-sm text-zinc-300">{b.guestName}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {b.confirmationCode ?? b.id.slice(0, 10)}…
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="rounded-lg bg-black/60 px-2 py-0.5">{b.bookingStatus}</span>
                  <span className="rounded-lg bg-black/60 px-2 py-0.5">{b.paymentStatus ?? "—"}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-shrink-0 flex-col items-stretch gap-2 sm:mt-0 sm:items-end">
                <p className="text-right text-lg font-semibold" style={{ color: GOLD }}>
                  {b.totalCents != null
                    ? (b.totalCents / 100).toLocaleString("en-CA", {
                        style: "currency",
                        currency: "CAD",
                      })
                    : "—"}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/host/bookings/${b.id}`}
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-900"
                  >
                    View
                  </Link>
                  {b.guestEmail ? (
                    <a
                      href={`mailto:${encodeURIComponent(b.guestEmail)}`}
                      className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-900"
                    >
                      Contact
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
