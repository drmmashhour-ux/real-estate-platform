"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  packageId: string;
  packageTitle: string;
  price: number;
};

export function PackageBookingForm({
  packageId,
  packageTitle,
  price,
}: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError("Please select start and end dates.");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setError("End date must be after start date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/packages/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          guestName: guestName.trim() || undefined,
          startDate,
          endDate,
          numberOfPeople: Math.max(1, numberOfPeople),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      router.push(`/packages/booking/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Book this package</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-slate-700"
            >
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-slate-700"
            >
              End date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="numberOfPeople"
            className="block text-sm font-medium text-slate-700"
          >
            Number of people
          </label>
          <input
            id="numberOfPeople"
            type="number"
            min={1}
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(parseInt(e.target.value, 10) || 1)}
            className="mt-1 w-full max-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label
            htmlFor="guestName"
            className="block text-sm font-medium text-slate-700"
          >
            Your name (optional)
          </label>
          <input
            id="guestName"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="For confirmation"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <p className="text-lg font-semibold text-slate-900">
            Total: ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Booking…" : "Book now"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </form>
    </div>
  );
}
