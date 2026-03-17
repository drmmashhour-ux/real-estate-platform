"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Breakdown = {
  subtotalCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  serviceFeeCents: number;
  totalCents: number;
  nights: number;
};

export function BNHubCheckoutClient({
  listingId,
  listingTitle,
  checkIn,
  checkOut,
  guestId,
  houseRules,
  cancellationPolicy,
}: {
  listingId: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guestId: string | null;
  houseRules: string | null;
  cancellationPolicy: string | null;
}) {
  const router = useRouter();
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasRules = Boolean(houseRules || cancellationPolicy);

  useEffect(() => {
    const params = new URLSearchParams({ listingId, checkIn, checkOut });
    fetch(`/api/bnhub/pricing/breakdown?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.breakdown ?? null)
      .then(setBreakdown)
      .catch(() => setBreakdown(null));
  }, [listingId, checkIn, checkOut]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestId) {
      setError("Sign in required.");
      return;
    }
    if (hasRules && !agreed) {
      setError("Please agree to the house rules and cancellation policy.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, checkIn, checkOut }),
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

  const nights = breakdown?.nights ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-slate-200">Your trip</h2>
        <p className="mt-1 text-slate-400">
          {checkIn} – {checkOut} · {nights} night{nights !== 1 ? "s" : ""}
        </p>
        <p className="mt-2 text-slate-300">{listingTitle}</p>
      </div>

      {breakdown && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-slate-200">Price breakdown</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>${(breakdown.subtotalCents / 100).toFixed(0)} × {breakdown.nights} nights</span>
              <span>${(breakdown.subtotalCents / 100).toFixed(0)}</span>
            </div>
            {breakdown.cleaningFeeCents > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Cleaning fee</span>
                <span>${(breakdown.cleaningFeeCents / 100).toFixed(0)}</span>
              </div>
            )}
            {breakdown.taxCents > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Taxes</span>
                <span>${(breakdown.taxCents / 100).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Service fee</span>
              <span>${(breakdown.serviceFeeCents / 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-3 font-semibold text-slate-100">
              <span>Total</span>
              <span>${(breakdown.totalCents / 100).toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {hasRules && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          {cancellationPolicy && (
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">Cancellation policy:</span> {cancellationPolicy}
            </p>
          )}
          {houseRules && (
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-medium text-slate-300">House rules:</span> {houseRules}
            </p>
          )}
          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-sm text-slate-300">I agree to the house rules and cancellation policy.</span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {!guestId ? (
          <Link
            href={`/bnhub/login?next=${encodeURIComponent(`/bnhub/checkout?listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}`)}`}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Sign in to book
          </Link>
        ) : (
          <button
            type="submit"
            disabled={loading || !breakdown || (hasRules && !agreed)}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Reserving…" : "Confirm and pay"}
          </button>
        )}
        <Link
          href={`/bnhub/${listingId}`}
          className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
