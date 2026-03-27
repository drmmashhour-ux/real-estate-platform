"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  roomId: string;
  roomTitle: string;
  pricePerNight: number;
  checkIn?: string;
  checkOut?: string;
  guests: number;
};

export function HotelBookingForm({
  roomId,
  roomTitle,
  pricePerNight,
  checkIn,
  checkOut,
  guests,
}: Props) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkInDate = checkIn || "";
  const checkOutDate = checkOut || "";
  const nights = checkInDate && checkOutDate
    ? Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : 1;
  const totalPrice = pricePerNight * nights;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError("Please select check-in and check-out dates on the search page");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hotels/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          guestName: guestName.trim(),
          checkIn: checkInDate,
          checkOut: checkOutDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      router.push(`/hotel/booking/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
      <div className="w-full sm:w-auto">
        <label className="sr-only">Your name</label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Guest name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-40"
        />
      </div>
      <div className="text-right text-sm text-slate-600">
        {nights} night{nights !== 1 ? "s" : ""} · ${totalPrice.toFixed(0)} total
      </div>
      <button
        type="submit"
        disabled={loading || !checkInDate || !checkOutDate}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Booking…" : "Book now"}
      </button>
      {error && (
        <p className="w-full text-sm text-red-600 sm:col-span-2">{error}</p>
      )}
    </form>
  );
}
