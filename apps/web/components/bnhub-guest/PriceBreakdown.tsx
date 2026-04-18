"use client";

export function PriceBreakdown({
  nights,
  nightPriceCents,
  cleaningFeeCents,
  guestFeeLabel = "Guest service fee",
}: {
  nights: number;
  nightPriceCents: number;
  cleaningFeeCents: number;
  guestFeeLabel?: string;
}) {
  const subtotal = nights * nightPriceCents;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-3 text-sm text-neutral-300">
      <div className="flex justify-between">
        <span>
          ${(nightPriceCents / 100).toFixed(0)} × {nights} nights
        </span>
        <span>${(subtotal / 100).toFixed(0)}</span>
      </div>
      <div className="flex justify-between">
        <span>Cleaning fee</span>
        <span>${(cleaningFeeCents / 100).toFixed(0)}</span>
      </div>
      <p className="text-xs text-neutral-500">{guestFeeLabel} and taxes are calculated at checkout.</p>
    </div>
  );
}
