"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function GuestBookingActions({ bookingId, className = "" }: { bookingId: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("Cancel this booking? Refund policy applies.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bnhub/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by: "guest" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={cancel}
        disabled={loading}
        className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Request cancellation"}
      </button>
      <Link
        href={`/bnhub/booking/${bookingId}/review`}
        className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        Leave a review
      </Link>
    </div>
  );
}
