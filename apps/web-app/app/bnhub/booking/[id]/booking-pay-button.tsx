"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingPayButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/bnhub/bookings/${bookingId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay now"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
