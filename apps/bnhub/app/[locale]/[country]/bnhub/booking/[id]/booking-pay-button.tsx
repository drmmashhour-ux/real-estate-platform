"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

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
    <div className="flex flex-col gap-3">
      {!stripeConfigured ? (
        <p className="flex items-start gap-2 text-xs text-premium-gold/85">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-premium-gold/70" strokeWidth={2} aria-hidden />
          <span>
            Demo mode: no card — we confirm in-app. Production uses{" "}
            <span className="font-medium text-premium-gold">Stripe</span> the same way.
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/75" strokeWidth={2} aria-hidden />
          <span>
            <span className="font-medium text-slate-400">Payments secured by Stripe</span> — card details are entered on
            Stripe&apos;s page; LECIPM never stores your full card number.
          </span>
        </p>
      )}
      <p className="text-center text-[11px] font-medium text-slate-400">
        👉 You won&apos;t be charged yet — confirm the total on the next step.
      </p>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full min-h-[48px] rounded-xl bg-premium-gold px-6 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-[0_8px_28px_rgba(212,175,55,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Opening secure checkout…"
          : stripeConfigured
            ? "Secure your booking"
            : "Secure your booking (demo, no card)"}
      </button>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">
        {stripeConfigured
          ? "After payment you’ll return here; your booking status updates automatically."
          : "Demo payment confirms instantly so you can test the rest of the flow."}
      </p>
    </div>
  );
}
