"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingPayButton({
  bookingId,
  amountCents,
  stripeConfigured,
}: {
  bookingId: string;
  amountCents: number;
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setError("");
    setLoading(true);
    try {
      if (!stripeConfigured) {
        const res = await fetch(`/api/bnhub/bookings/${encodeURIComponent(bookingId)}/simulate-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Demo payment failed");
        router.replace(`/bnhub/booking/${bookingId}?paid=1`);
        router.refresh();
        return;
      }

      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: "booking",
          bookingId,
          amountCents,
          currency: "cad",
          successUrl: `${base}/bnhub/booking/${bookingId}?paid=1`,
          cancelUrl: `${base}/bnhub/booking/${bookingId}`,
          description: `Booking ${bookingId}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {!stripeConfigured && (
        <p className="mb-2 text-xs text-amber-400">
          Stripe is not configured — demo mode completes payment in-app (no card). Use real Stripe in production.
        </p>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing…" : stripeConfigured ? "Pay now" : "Complete demo payment"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-slate-500">
        {stripeConfigured
          ? "You will complete payment on Stripe. Your booking is confirmed only after payment succeeds."
          : "Demo mode confirms your booking immediately after you click complete."}
      </p>
    </div>
  );
}
