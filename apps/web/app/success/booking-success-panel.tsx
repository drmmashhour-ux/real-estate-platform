"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookingPayload = {
  id: string;
  startDate: string;
  endDate: string;
  listing: { title: string; city: string };
};

export function BookingSuccessPanel({ bookingId }: { bookingId?: string }) {
  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId?.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setErr(data.error || "Could not load booking");
          return;
        }
        if (!cancelled) setBooking(data);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (!bookingId) {
    return (
      <p className="text-muted-foreground">
        Thanks — your test checkout completed. For BNHub bookings, fulfillment is driven by Stripe webhooks, not this
        page.
      </p>
    );
  }

  if (err) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Payment succeeded. We could not load booking <code>{bookingId}</code>: {err}
        </p>
        <p className="text-sm text-muted-foreground">If you are not logged in, sign in and refresh this page.</p>
        <Link href="/login" className="underline">
          Login
        </Link>
      </div>
    );
  }

  if (!booking) {
    return <p className="text-muted-foreground">Loading booking…</p>;
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
      <p>
        <strong>Booking</strong> <code>{booking.id}</code>
      </p>
      <p>
        <strong>Listing:</strong> {booking.listing.title} — {booking.listing.city}
      </p>
      <p>
        <strong>Dates:</strong> {booking.startDate.slice(0, 10)} → {booking.endDate.slice(0, 10)}
      </p>
      <Link href="/listings" className="underline">
        Back to listings
      </Link>
    </div>
  );
}
