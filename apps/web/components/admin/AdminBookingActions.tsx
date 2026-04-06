"use client";

import Link from "next/link";

const GOLD = "#D4AF37";

export function AdminBookingActions({
  bookingId,
  guestEmail,
  hostEmail,
}: {
  bookingId: string;
  guestEmail: string | null;
  hostEmail: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/bnhub/booking/${bookingId}`} className="text-xs font-medium" style={{ color: GOLD }}>
        View
      </Link>
      {guestEmail ? (
        <a href={`mailto:${encodeURIComponent(guestEmail)}`} className="text-xs text-zinc-400 hover:text-zinc-200">
          Guest
        </a>
      ) : null}
      {hostEmail ? (
        <a href={`mailto:${encodeURIComponent(hostEmail)}`} className="text-xs text-zinc-400 hover:text-zinc-200">
          Host
        </a>
      ) : null}
      <Link href={`/bnhub/booking/${bookingId}`} className="text-xs text-rose-300 hover:underline">
        Cancel / refund
      </Link>
    </div>
  );
}
