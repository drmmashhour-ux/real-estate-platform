import { PremiumTrust } from "@/components/booking/PremiumTrust";
import { TrustBadges } from "@/components/listing/TrustBadges";
import { PriceBreakdown } from "@/components/booking/PriceBreakdown";
import { BookingHoldNotice } from "@/components/booking/BookingHoldNotice";

export type BookingSummaryProps = {
  from: string;
  to: string;
  nights: number;
  pricePerNight: number;
  /** Charged total (formatted), aligned with checkout `amount` when dates are set. */
  totalDisplay: string;
  onConfirm: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** From `generateUrgency` — short conversion nudges. */
  urgencyMessages?: string[];
  /** ISO — from POST /api/bookings for 15m hold copy (Order 57.1). */
  holdExpiresAt?: string | null;
  /** When false, skip flat nightly × rate block — parent shows Order 61 dynamic lines. */
  showFlatBreakdown?: boolean;
};

export function BookingSummary({
  from,
  to,
  nights,
  pricePerNight,
  totalDisplay,
  onConfirm,
  busy = false,
  disabled = false,
  urgencyMessages = [],
}: BookingSummaryProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your stay</h2>

      <div className="mt-4 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        <p>
          <span className="text-zinc-500 dark:text-zinc-500">From</span> {from || "—"}
        </p>
        <p>
          <span className="text-zinc-500 dark:text-zinc-500">To</span> {to || "—"}
        </p>
      </div>

      {urgencyMessages.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {urgencyMessages.map((m) => (
            <span
              key={m}
              className="text-sm font-medium text-red-600 dark:text-red-500"
            >
              {m}
            </span>
          ))}
        </div>
      ) : null}

      {showFlatBreakdown ? (
        nights > 0 ? (
          <PriceBreakdown nights={nights} pricePerNight={pricePerNight} />
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Select your dates to see the price breakdown.</p>
        )
      ) : null}

      {nights > 0 && totalDisplay !== "—" ? (
        <p className="mt-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Checkout total: </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalDisplay}</span>
          <span className="ml-1 text-xs text-zinc-500">(incl. fees)</span>
        </p>
      ) : null}

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <PremiumTrust />
        <TrustBadges />
      </div>

      {nights > 0 && from && to && from !== "—" && to !== "—" ? (
        <div className="mt-4 rounded-lg border border-amber-200/50 bg-amber-50/80 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
          <BookingHoldNotice expiresAtIso={holdExpiresAt} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled || busy}
        className="mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {busy ? "Working…" : "Confirm & Pay"}
      </button>
    </div>
  );
}
