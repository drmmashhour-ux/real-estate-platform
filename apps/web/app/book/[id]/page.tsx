"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { generateUrgency } from "@/lib/ai/urgency";
import {
  calculateTotalPrice,
  dateFromYmd,
  totalWithPlatformFeeCents,
} from "@/lib/pricing/calculateTotal";
import { BookingSummary } from "./BookingSummary";

type BookedRange = { id: string; startDate: string; endDate: string };

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `YYYY-MM-DD` slice of API/DB date strings; avoids `new Date(iso)` local-TZ shift (Order 61). */
function ymdKey(s: string) {
  return s.slice(0, 10);
}

function isBooked(date: Date, bookedDates: BookedRange[]) {
  const tYmd = toISODateLocal(date);
  return bookedDates.some((b) => {
    const start = ymdKey(b.startDate);
    const end = ymdKey(b.endDate);
    return tYmd >= start && tYmd <= end;
  });
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Inclusive; steps by calendar day (DST-safe, unlike +86_400_000). */
function rangeTouchesBooked(from: Date, to: Date, bookedDates: BookedRange[]): boolean {
  let lo = startOfLocalDay(from);
  let hi = startOfLocalDay(to);
  if (lo.getTime() > hi.getTime()) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const cur = new Date(lo);
  while (cur.getTime() <= hi.getTime()) {
    if (isBooked(cur, bookedDates)) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

function stayNightsFromRange(start: Date, end: Date): number {
  const n = (end.getTime() - start.getTime()) / MS_PER_DAY;
  if (n <= 0) return 1;
  return Math.max(1, Math.round(n));
}

export default function BookingPage() {
  const params = useParams();
  const listingId = typeof params?.id === "string" ? params.id : "";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookedDates, setBookedDates] = useState<BookedRange[]>([]);
  const [range, setRange] = useState<[Date, Date] | Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<{ price: number; title?: string } | null>(null);
  const [bookingCountSignal, setBookingCountSignal] = useState(0);
  /** Active calendar month’s year; drives a bounded `from`/`to` booking fetch (Order 64). */
  const [bookingsViewYear, setBookingsViewYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    if (!listingId) return;
    setError(null);
    fetch(`/api/listings/${listingId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && typeof (data as { price?: number }).price === "number") {
          setListing({
            price: (data as { price: number }).price,
            title: typeof (data as { title?: string }).title === "string" ? (data as { title: string }).title : undefined,
          });
        } else {
          setListing(null);
        }
      })
      .catch(() => setListing(null));
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    setError(null);
    const y = bookingsViewYear;
    const from = `${y - 1}-01-01`;
    const to = `${y + 1}-12-31`;
    fetch(
      `/api/listings/${listingId}/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setBookedDates(data as BookedRange[]);
        else setBookedDates([]);
      })
      .catch(() => setBookedDates([]));
  }, [listingId, bookingsViewYear]);

  useEffect(() => {
    if (!listingId) return;
    fetch(
      `/api/listings/${listingId}/bookings?from=${encodeURIComponent("2000-01-01")}&to=${encodeURIComponent("2100-12-31")}`
    )
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setBookingCountSignal(data.length);
        else setBookingCountSignal(0);
      })
      .catch(() => setBookingCountSignal(0));
  }, [listingId]);

  const urgencyMessages = useMemo(
    () => generateUrgency({ bookings: bookingCountSignal, views: undefined }),
    [bookingCountSignal]
  );

  const { displayNights: nightsForUi, totalDisplay } = useMemo(() => {
    if (!listing || !startDate || !endDate) {
      return { displayNights: 0, totalDisplay: "—" };
    }
    const start = dateFromYmd(startDate);
    const end = dateFromYmd(endDate);
    const n = stayNightsFromRange(start, end);
    const subtotalDollars = calculateTotalPrice(start, end, listing.price);
    const subtotalCents = Math.round(subtotalDollars * 100);
    const { finalCents } = totalWithPlatformFeeCents(subtotalCents);
    const totalDisplay = (finalCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return { displayNights: n, totalDisplay };
  }, [listing, startDate, endDate]);

  async function handleBooking() {
    if (!listingId || !startDate || !endDate) {
      setError("Choose dates first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          startDate,
          endDate,
        }),
      });

      const data = (await res.json()) as { error?: string; code?: string; id?: string };
      if (!res.ok) {
        if (res.status === 409 || data.code === "BOOKING_CONFLICT" || data.error === "Dates not available") {
          setError("Some dates are already booked. Please select different dates.");
        } else {
          setError(data.error || "Booking failed");
        }
        return;
      }

      if (!listing || !Number.isFinite(listing.price) || listing.price < 0) {
        setError("Listing price not available. Refresh and try again.");
        return;
      }

      const start = dateFromYmd(startDate);
      const end = dateFromYmd(endDate);
      const subtotalDollars = calculateTotalPrice(start, end, listing.price);
      const subtotalCents = Math.round(subtotalDollars * 100);
      const { finalCents } = totalWithPlatformFeeCents(subtotalCents);
      const amount = Math.max(50, finalCents);

      const base =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
      const payment = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          productName: `Stay (${startDate} → ${endDate})`,
          listingId,
          successUrl: `${base}/success?bookingId=${encodeURIComponent(data.id!)}`,
          cancelUrl: `${base}/cancel`,
          metadata: {
            bookingId: data.id,
            listingId,
            paymentType: "marketplace_listing_checkout",
          },
        }),
      });

      const checkout = await payment.json();
      if (!payment.ok || !checkout.url) {
        setError((checkout as { error?: string }).error || "Checkout failed");
        return;
      }

      window.location.href = checkout.url as string;
    } finally {
      setBusy(false);
    }
  }

  if (!listingId) {
    return (
      <div className="p-10">
        <p>Invalid listing.</p>
        <Link className="text-blue-600 underline" href="/listings">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href={`/listings/${listingId}`}>
            ← Listing
          </Link>
          <span className="mx-2">·</span>
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/listings">
            All listings
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {listing?.title ? `Book: ${listing.title}` : "Book your stay"}
        </h1>

        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Unavailable dates are greyed out. Select a check-in and check-out range. Prices include a 10% service
          fee at checkout.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
          <div>
            <div className="max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <Calendar
                selectRange
                value={range}
                onActiveStartDateChange={({ activeStartDate }) => {
                  setError(null);
                  setBookingsViewYear(activeStartDate.getFullYear());
                }}
                onChange={(v) => {
                  setError(null);
                  if (Array.isArray(v) && v[0] && v[1]) {
                    const a = v[0];
                    const b = v[1];
                    const from = a < b ? a : b;
                    const to = a < b ? b : a;
                    if (rangeTouchesBooked(from, to, bookedDates)) {
                      setError("Some dates are not available. Please select a different range.");
                      setRange(null);
                      setStartDate("");
                      setEndDate("");
                      return;
                    }
                    setRange([from, to]);
                    setStartDate(toISODateLocal(from));
                    setEndDate(toISODateLocal(to));
                    return;
                  }
                  if (v instanceof Date) {
                    setRange(v);
                    setStartDate(toISODateLocal(v));
                    setEndDate(toISODateLocal(v));
                  }
                }}
                tileDisabled={({ date }) => isBooked(date, bookedDates)}
              />
            </div>

            {error ? (
              <div
                className="mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </div>

          <BookingSummary
            from={startDate || "—"}
            to={endDate || "—"}
            nights={nightsForUi}
            pricePerNight={listing?.price ?? 0}
            totalDisplay={totalDisplay}
            onConfirm={() => void handleBooking()}
            busy={busy}
            disabled={busy || !startDate || !endDate || !listing}
            urgencyMessages={urgencyMessages}
          />
        </div>
      </div>
    </div>
  );
}
