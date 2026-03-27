"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  listingId: string;
  totalSpots: number;
  bookedSpots: number;
  pricePerSpot: number;
};

export function SharedBookingCard({
  id,
  listingId,
  totalSpots,
  bookedSpots,
  pricePerSpot,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = bookedSpots >= totalSpots;

  async function handleJoin() {
    if (full) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/shared-bookings/${id}/book`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to book spot");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to book spot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-slate-600">
        <span className="font-medium text-slate-900">Join this stay</span>
        <span className="mx-1.5 text-slate-400">·</span>
        <span>
          ({bookedSpots}/{totalSpots} spots filled)
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Listing: {listingId}
      </p>
      <p className="mt-2 font-semibold text-slate-900">
        ${pricePerSpot.toFixed(2)} per spot
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={handleJoin}
        disabled={full || loading}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {full
          ? "Fully booked"
          : loading
            ? "Joining…"
            : "Join this stay"}
      </button>
    </div>
  );
}
