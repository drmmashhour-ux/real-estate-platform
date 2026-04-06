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
          successUrl: `${base}/bnhub/booking-success?booking_id=${encodeURIComponent(bookingId)}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${base}/bnhub/booking-cancel?booking_id=${encodeURIComponent(bookingId)}`,
          description: `Booking ${bookingId}`,
        }),
      });
      const data = (await res.json()) as { error?: string; code?: string; url?: string };
      if (!res.ok) {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Checkout failed. Please try again later.";
        throw new Error(msg);
      }
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
    <div className="flex flex-col gap-2">
      {!stripeConfigured ? (
        <p className="text-xs text-amber-400">Demo: no card — confirms in-app.</p>
      ) : null}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Opening…" : stripeConfigured ? "Pay securely with Stripe" : "Complete demo payment"}
      </button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {stripeConfigured ? (
        <p className="text-xs text-slate-500">Secure checkout — you return here when done.</p>
      ) : null}
    </div>
  );
}
