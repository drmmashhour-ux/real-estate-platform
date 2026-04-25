"use client";

import { useMemo } from "react";
import {
  calculateBookingTotalCents,
  resolveBnhubPlatformGuestFeePercent,
  type CalculateBookingTotalOptions,
} from "@/lib/bnhub/booking-revenue-pricing";

function cad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

type Props = {
  /** Nightly rate in cents (host portion). */
  nightPriceCents: number;
  nights: number;
  /** Optional cleaning / host extras in cents. */
  extrasCents?: number;
  options?: CalculateBookingTotalOptions;
  /** When true, shows the resolved platform fee percent from env. */
  showFeePercentNote?: boolean;
  className?: string;
};

/**
 * Transparent guest-facing breakdown: price/night, subtotal (base), service fee, total.
 * Uses `calculateBookingTotalCents` (10–15% platform fee band).
 */
export function BookingPriceBreakdown({
  nightPriceCents,
  nights,
  extrasCents = 0,
  options,
  showFeePercentNote = true,
  className = "",
}: Props) {
  const b = useMemo(
    () => calculateBookingTotalCents(nightPriceCents, nights, { ...options, extrasCents }),
    [nightPriceCents, nights, extrasCents, options],
  );
  const pct = showFeePercentNote ? resolveBnhubPlatformGuestFeePercent() : b.serviceFeePercent;
  const nightlySubtotal = nightPriceCents * Math.max(1, nights);

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6 ${className}`.trim()}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/45">Price details</h3>
      <p className="mt-1 text-xs text-white/40">
        No hidden fees — subtotal is what goes to the stay (before the platform service fee).
        {showFeePercentNote ? ` Service fee is ${pct}% (10–15% band).` : null}
      </p>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">{cad(nightPriceCents)} × {nights} nights</dt>
          <dd className="tabular-nums text-white">{cad(nightlySubtotal)}</dd>
        </div>
        {extrasCents > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">Cleaning &amp; host extras</dt>
            <dd className="tabular-nums text-white">{cad(extrasCents)}</dd>
          </div>
        ) : null}
        {b.upsellsCents > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-white/60">Add-ons (early/late/cleaning)</dt>
            <dd className="tabular-nums text-white">{cad(b.upsellsCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="font-medium text-white/80">Subtotal (base)</dt>
          <dd className="tabular-nums font-medium text-white">{cad(b.baseAmountCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/60">Platform service fee ({b.serviceFeePercent}%)</dt>
          <dd className="tabular-nums text-white">{cad(b.serviceFeeCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-3 text-base font-semibold">
          <dt className="text-white">Total</dt>
          <dd className="tabular-nums text-[#D4AF37]">{cad(b.totalCents)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-white/45">
        Host receives {cad(b.hostReceivesCents)} before any BNHub host payout deductions (e.g. Stripe Connect).
      </p>
    </div>
  );
}
