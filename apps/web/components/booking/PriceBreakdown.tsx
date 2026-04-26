const FEE_RATE = 0.1;

export type PriceBreakdownProps = {
  nights: number;
  /** Nightly price in major units (e.g. USD dollars). */
  pricePerNight: number;
};

/**
 * 10% service fee on subtotal — aligned with `totalWithPlatformFeeCents` in pricing helpers.
 */
function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function PriceBreakdown({ nights, pricePerNight }: PriceBreakdownProps) {
  const safeNights = Math.max(0, nights);
  const subtotal = Math.round(safeNights * pricePerNight);
  const fee = Math.round(subtotal * FEE_RATE);
  const total = subtotal + fee;

  return (
    <div className="mt-4 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
      <p>
        {safeNights} {safeNights === 1 ? "night" : "nights"} × ${fmtUsd(pricePerNight)} = ${subtotal}
      </p>
      <p>Service fee (10%) = ${fee}</p>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Total = ${total}</p>
    </div>
  );
}
