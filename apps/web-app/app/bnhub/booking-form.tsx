"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PricingBreakdown = {
  nightlyBreakdown: { date: string; cents: number }[];
  subtotalCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  serviceFeeCents: number;
  totalCents: number;
  nights: number;
  currency: string;
};

export function BookingForm({
  listingId,
  nightPriceCents,
  cleaningFeeCents = 0,
  instantBookEnabled = false,
  guestId,
  houseRules,
  cancellationPolicy,
}: {
  listingId: string;
  nightPriceCents: number;
  cleaningFeeCents?: number;
  instantBookEnabled?: boolean;
  guestId: string | null;
  houseRules?: string | null;
  cancellationPolicy?: string | null;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [notes, setNotes] = useState("");
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const hasRulesToConfirm = Boolean(houseRules || cancellationPolicy);

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut || nights < 1) {
      setBreakdown(null);
      return;
    }
    const params = new URLSearchParams({ listingId, checkIn, checkOut });
    fetch(`/api/bnhub/pricing/breakdown?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.breakdown ?? null)
      .then(setBreakdown)
      .catch(() => setBreakdown(null));
  }, [listingId, checkIn, checkOut, nights]);

  const displayBreakdown = breakdown ?? {
    subtotalCents: nights * nightPriceCents,
    cleaningFeeCents,
    taxCents: 0,
    serviceFeeCents: Math.round((nights * nightPriceCents * 12) / 100),
    totalCents: nights * nightPriceCents + Math.round((nights * nightPriceCents * 12) / 100) + cleaningFeeCents,
    nights,
    currency: "USD",
    nightlyBreakdown: [],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestId) {
      setError("Sign in required to book.");
      return;
    }
    if (!checkIn || !checkOut || nights < 1) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (hasRulesToConfirm && !agreedToRules) {
      setError("Please confirm you agree to the house rules and cancellation policy.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guestNotes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      router.push(`/bnhub/booking/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Check-in
        </label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Check-out
        </label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn || new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      {nights > 0 && (
        <>
          <Link
            href={`/bnhub/checkout?listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}`}
            className="mb-2 block text-center text-sm text-emerald-400 hover:text-emerald-300"
          >
            Proceed to checkout →
          </Link>
          <div className="border-t border-slate-700 pt-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>${(displayBreakdown.subtotalCents / 100).toFixed(0)} × {displayBreakdown.nights} nights</span>
            <span>${(displayBreakdown.subtotalCents / 100).toFixed(0)}</span>
          </div>
          {displayBreakdown.cleaningFeeCents > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Cleaning fee</span>
              <span>${(displayBreakdown.cleaningFeeCents / 100).toFixed(0)}</span>
            </div>
          )}
          {displayBreakdown.taxCents > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Tax</span>
              <span>${(displayBreakdown.taxCents / 100).toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Service fee</span>
            <span>${(displayBreakdown.serviceFeeCents / 100).toFixed(0)}</span>
          </div>
          <div className="mt-2 flex justify-between font-semibold text-slate-100">
            <span>Total</span>
            <span>${(displayBreakdown.totalCents / 100).toFixed(0)}</span>
          </div>
        </div>
        </>
      )}
      {hasRulesToConfirm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
          {cancellationPolicy && (
            <p className="text-xs text-slate-400">
              <span className="font-medium text-slate-300">Cancellation:</span> {cancellationPolicy}
            </p>
          )}
          <label className="mt-2 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
            />
            <span className="text-sm text-slate-300">
              I agree to the house rules{cancellationPolicy ? " and cancellation policy" : ""}.
            </span>
          </label>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Message for host"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {!guestId ? (
        <Link
          href={`/bnhub/login?next=${encodeURIComponent(`/bnhub/${listingId}`)}`}
          className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Sign in to book
        </Link>
      ) : (
        <button
          type="submit"
          disabled={loading || nights < 1 || (hasRulesToConfirm && !agreedToRules)}
          className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
            {loading
              ? "Booking…"
              : instantBookEnabled
                ? "Book now"
                : "Request to book"}
        </button>
      )}
    </form>
  );
}
